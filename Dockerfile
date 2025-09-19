    FROM cimg/go:1.24

    RUN useradd -ms /bin/bash apprunner
    USER apprunner
    WORKDIR /home/apprunner
    RUN git clone https://github.com/navarrastar/dex
    WORKDIR /home/apprunner/dex

    CMD go run src/main.go