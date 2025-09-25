package main

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type PlayerState struct {
    EntityIndex uint64 `json:"entity_index"`
    SteamID     uint64 `json:"steam_id"`
    SteamName   string `json:"steam_name"`
    Team        uint64 `json:"team"`
    HeroID      uint64 `json:"hero_id"`
    PlayerSlot  uint64 `json:"player_slot"`
    Rank        uint64 `json:"rank"`
    AssignedLane uint64 `json:"assigned_lane"`
    OriginalAssignedLane uint64 `json:"original_assigned_lane"`
    Upgrades    []int  `json:"upgrades"`
}

type MatchConnection struct {
    MatchID      string
    PlayerStates sync.Map // Key: uint64 (steam_id), Value: *PlayerState
    CancelFunc   context.CancelFunc
    IsConnected  bool
    Mutex        sync.RWMutex
}

var matchConnections sync.Map // Key: string (MatchID), Value: *MatchConnection

func main() {
    router := gin.Default()

    router.POST("/matches/:match_id", routefunc_addMatch)
    router.DELETE("/matches/:match_id", routefunc_removeMatch)
    
    go startStatePrinter(5 * time.Second)

    log.Println("Starting server on :3001")
    if err := router.Run(":3001"); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}

func routefunc_addMatch(c *gin.Context) {
    match_id := c.Param("match_id")
    
    if err := AddMatch(match_id); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Match added successfully",
        "match_id": match_id,
    })
}

func routefunc_removeMatch(c *gin.Context) {
    match_id := c.Param("match_id")

    RemoveMatch(match_id)

    c.JSON(http.StatusOK, gin.H{
        "message": "Match removed successfully",
        "match_id": match_id,
    })
}

func AddMatch(match_id string) error {
    if _, exists := matchConnections.Load(match_id); exists {
        return errors.New("match is already being tracked")
    }

    conn := &MatchConnection{
        MatchID:     match_id,
        IsConnected: false,
    }
    matchConnections.Store(match_id, conn)

    go conn.maintainConnection()

    return nil
}

func RemoveMatch(match_id string) {
    if value, exists := matchConnections.Load(match_id); exists {
        if conn, ok := value.(*MatchConnection); ok {
            if conn.CancelFunc != nil {
                conn.CancelFunc()
            }
        }
        matchConnections.Delete(match_id)
    }
}

func (self *MatchConnection) maintainConnection() {
	url := fmt.Sprintf("http://deadlock-live-events:3000/v1/matches/%s/live/demo/events", self.MatchID)
	retryDelay := time.Second
	
	for {
		ctx, cancel := context.WithCancel(context.Background())
		self.Mutex.Lock()
		self.CancelFunc = cancel
		self.Mutex.Unlock()
		
		err := self.connectToEvents(ctx, url)
		if err != nil {
			log.Printf("Connection error for match %s: %v. Retrying in %v", self.MatchID, err, retryDelay)
			
			// Exponential backoff for retries, capped at 30 seconds
			time.Sleep(retryDelay)
			retryDelay = time.Duration(min(float64(retryDelay)*1.5, 30)) * time.Second
			
			// Check if we should stop trying
			if _, exists := matchConnections.Load(self.MatchID); !exists {
				return // Match was removed, stop trying to reconnect
			}
			continue
		}
		
		// If we get here, the connection was closed normally
		retryDelay = time.Second // Reset retry delay on successful connections
		
		// Check if we should stop trying
		if _, exists := matchConnections.Load(self.MatchID); !exists {
			return // Match was removed, stop trying to reconnect
		}
	}
}

func (self *MatchConnection) connectToEvents(ctx context.Context, url string) error {
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return fmt.Errorf("created request: %w", err)
    }

    req.Header.Set("Accept", "text/event-stream")
    req.Header.Set("Cache-Control", "no-cache")
    req.Header.Set("Connection", "keep-alive")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return fmt.Errorf("making request: %w", err)
    } 
    defer resp.Body.Close()

    if resp.StatusCode != 200 {
        return fmt.Errorf("received non-200 status code: %d", resp.StatusCode)
    }

    self.Mutex.Lock()
    self.IsConnected = true
    self.Mutex.Unlock()

    log.Printf("Connected to events for match %s", self.MatchID)

	reader := bufio.NewReader(resp.Body)
	for {
		select {
		case <-ctx.Done():
			return nil
		default:
			// Read the event stream
			line, err := reader.ReadString('\n')
			if err != nil {
				if err == io.EOF {
					return errors.New("connection closed by server")
				}
				return fmt.Errorf("reading event stream: %w", err)
			}

			if !strings.HasPrefix(line, "event: ") {
                continue
            }

			// Process events
            eventType := strings.TrimSpace(line[len("event: "):])
            dataLine, err := reader.ReadString('\n') 
            if err != nil {
                return fmt.Errorf("reading data line: %w", err)
            }
            if !strings.HasPrefix(dataLine, "data: ") {
                return fmt.Errorf("dataLine didn't start with 'data: ':")
            }
            eventData := strings.TrimSpace(dataLine[len("data: "):])
            
            switch eventType {
            case "player_controller_entity_update":
                self.process_event_player_controller_entity_update(eventData)
            
            case "end":
                self.process_event_end(eventData)
                return nil
            }

		}
    }
}

func (mc *MatchConnection) process_event_player_controller_entity_update(data string) {
	var update PlayerState

	if err := json.Unmarshal([]byte(data), &update); err != nil {
		log.Printf("Failed to unmarshal player update for match %s: %v", mc.MatchID, err)
		return
	}

	mc.PlayerStates.Store(update.SteamID, &update)
}

func (mc *MatchConnection) process_event_end(data string) {
    log.Printf("Match %s has ended, removing from tracking", mc.MatchID)
    RemoveMatch(mc.MatchID)
}

func startStatePrinter(interval time.Duration) {
    ticker := time.NewTicker(interval)
    defer ticker.Stop()

    for range ticker.C {
        printAllMatchesState()
    }
}

func printAllMatchesState() {
    fmt.Printf("\n=== Match States at %v ===\n", time.Now().Format("15:04:05"))
	
    matchCount := 0
	matchConnections.Range(func(matchID, value interface{}) bool {
		conn, ok := value.(*MatchConnection)
        if !ok {
            return true
        }

        matchCount++
		fmt.Printf("Match ID: %s\n", matchID.(string))
		
		// Print each player's state
		conn.PlayerStates.Range(func(steamID, playerState interface{}) bool {
			ps, ok := playerState.(*PlayerState)
            if !ok {
                return true
            }

			fmt.Printf("  Steam ID: %d, Name: %s, Team: %d, Hero ID: %d, Player Slot: %d\n", 
				ps.SteamID, ps.SteamName, ps.Team, ps.HeroID, ps.PlayerSlot)
			fmt.Printf("    Entity Index: %d, Original Assigned Lane: %d\n",
				ps.EntityIndex, ps.OriginalAssignedLane)
			fmt.Printf("    Upgrades: %v\n", ps.Upgrades)
			return true
		})
		
		fmt.Println()
		return true
	})

    if matchCount == 0 {
        fmt.Println("No matches currently being tracked")
    }
	
	fmt.Printf("=== End of Match States ===\n\n")
}
