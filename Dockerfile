FROM cimg/go:1.24 as builder

WORKDIR /app
RUN git clone https://github.com/navarrastar/dex
WORKDIR /app/dex
RUN go build -o /main ./src/main.go

FROM scratch

COPY --from=builder /main /main

CMD /main