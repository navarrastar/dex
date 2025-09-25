FROM cimg/go:1.24 as builder

USER root
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /main ./src/main.go

FROM scratch

COPY --from=builder /main /main
CMD ["/main"]