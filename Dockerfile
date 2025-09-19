    FROM debian:latest

    RUN apt-get update && \
        apt-get install -y --no-install-recommends \
        ca-certificates \
        clang-18 \
        llvm-18-dev \
        llvm-18-tools \
        libc++-18-dev \
        libc++abi-18-dev \
        git \
        make \
        gcc \
        g++ \
        libstdc++-14-dev    

    ENV PATH="/usr/lib/llvm-18/bin:$PATH"
    RUN ln -s /usr/bin/clang-18 /usr/bin/clang && \
        ln -s /usr/bin/clang++-18 /usr/bin/clang++ && \
        ln -s /usr/bin/llvm-config-18 /usr/bin/llvm-config

    RUN useradd -ms /bin/bash apprunner
    USER apprunner
    WORKDIR /home/apprunner

    RUN git clone https://github.com/odin-lang/Odin
    WORKDIR /home/apprunner/Odin
    # NEEDED?????
    ENV CC=clang-18 \
        CXX=clang++-18 \
        LLVM_CONFIG=/usr/bin/llvm-config-18

    RUN make release-native

    # For some reason, these aren't building automatically
    RUN make -C "/home/apprunner/Odin/vendor/stb/src"

    ENV PATH="/home/apprunner/Odin:${PATH}"

    WORKDIR /home/apprunner
    RUN git clone https://github.com/navarrastar/dex
    WORKDIR /home/apprunner/dex

    # Odin run server command
    CMD ["odin", "run", "src/", "-o:speed"]

    COPY src ./src
    EXPOSE 3001