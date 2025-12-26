FROM golang:1.25-alpine

# ติดตั้งเครื่องมือสำหรับ SQLite
RUN apk add --no-cache build-base

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# ตั้งค่า CGO และ Build
ENV CGO_ENABLED=1
# ตรวจสอบว่า main.go อยู่ใน cmd/server/ ใช่ไหม ถ้าใช่ให้ใช้ path นี้
RUN go build -o main ./cmd/server/main.go

EXPOSE 8080

CMD ["./main"]