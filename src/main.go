package main

import (
    "bufio"
    "context"
    "encoding/json"
    "fmt"
    "log"
    "strings"
    "sync"
    "time"
    "github.com/gin-gonic/gin"
    "net/http"
)

type PlayerState struct {
    SteamID uint64 `json:"steam_id"`
    Upgrades []int `json:"upgrades"`
}

type MatchState struct {
    PlayerStates sync.Map // Key: uint64 (steam_id), Value: *PlayerState
    LastUpdated  time.Time
}

var matches sync.Map // Key: uint64 (match_id), Value: *MatchState

func main() {
    AddMatch("42661530")

    go updateAllMatchesEvery(5 * time.Second)

    select {}
}

func updateAllMatchesEvery(interval time.Duration) {
    ticker := time.NewTicker(interval)
    defer ticker.Stop()

    for range ticker.C {
        matches.Range(func(match_id, matchState interface{}) bool {
            go updateMatchState(match_id.(string), matchState.(*MatchState))
            return true
        })
    }
}

func updateMatchState(match_id string, matchState *MatchState) {
    ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
    defer cancel()

    url := fmt.Sprintf("http://0.0.0.0:3000/v1/matches/%s/live/demo/events", match_id)
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        log.Printf("Error creating request for match %s: %v", match_id, err)
        return
    }

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        log.Printf("Error fetching events for match %s: %v", match_id, err)
        return
    }
    defer resp.Body.Close()

    scanner := bufio.NewScanner(resp.Body)
    for scanner.Scan() {
        line := scanner.Text()
        if strings.HasPrefix(line, "event: ") {
            eventType := strings.TrimSpace(line[len("event: "):])
            if eventType != "player_controller_entity_update" {
                continue
            }

            if !scanner.Scan() {
                break
            }

            dataLine := scanner.Text()
            if !strings.HasPrefix(dataLine, "data: ") {
                continue
            }

            data := strings.TrimSpace(dataLine[len("data: "):])
            var state PlayerState
            if err := json.Unmarshal([]byte(data), &state); err != nil {
                log.Printf("Failed to unmarshal event data for match %s: %v", match_id, err)
                continue
            }

            matchState.PlayerStates.Store(state.SteamID, &state)
        }
    }

    if err := scanner.Err(); err != nil {
        log.Printf("Error reading response for match %s: %v", match_id, err)
    }

    matchState.LastUpdated = time.Now()
    log.Printf("Updated state for match %s at %v", match_id, matchState.LastUpdated)
}

func AddMatch(match_id string) {
    matchState := &MatchState {
        LastUpdated: time.Now(),
    }

    matches.Store(match_id, matchState)
    
    go updateMatchState(match_id, matchState)
}

func RemoveMatch(match_id string) {
    matches.Delete(match_id)
}

func GetPlayerState(match_id string, steam_id uint64) (*PlayerState, bool) {
    matchState, exists := matches.Load(match_id)
    if !exists {
        return nil, false
    }

    value, exists := matchState.(*MatchState).PlayerStates.Load(steam_id)
    if !exists {
        return nil, false
    }

    return value.(*PlayerState), true
}

func GetMatchPlayers(matchID string) ([]*PlayerState, bool) {
	matchState, exists := matches.Load(matchID)
	if !exists {
		return nil, false
	}
	
	var players []*PlayerState
	matchState.(*MatchState).PlayerStates.Range(func(_, value interface{}) bool {
		players = append(players, value.(*PlayerState))
		return true
	})
	
	return players, true
}
    
// func main() {
//   router := gin.Default()

//   router.GET("/ping", func(c *gin.Context) {
//     c.JSON(http.StatusOK, gin.H{
//       "message": "pong",
//     })
//   })

//   router.Run()
// }