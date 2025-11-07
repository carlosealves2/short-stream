FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy pre-built binary
COPY dist/apps/video_uploader/main .

CMD ["./main"]
