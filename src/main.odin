package main

import "core:fmt"
import "core:net"

import "../http"



main :: proc() {
    fmt.println("Hello1")

    server: http.Server
    http.server_shutdown_on_interrupt(&server)

    router: http.Router
    http.router_init(&router)
    defer http.router_destroy(&router)

    http.route_get(&router, "/ping", http.handler(routeproc_ping))

    routed := http.router_handler(&router)

    endpoint := net.Endpoint {
        address = net.IP4_Loopback,
        port = 3000
    }

    err := http.listen_and_serve(&server, routed, endpoint)
    fmt.assertf(err == nil, "server stopped with error: %v", err)
}

routeproc_ping :: proc(req: ^http.Request, res: ^http.Response) {
    http.respond_plain(res, "pong")
}


