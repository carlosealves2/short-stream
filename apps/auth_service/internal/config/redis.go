package config

type RedisConfig struct {
	Addr     string
	Password string
	DB       int
}

func newRedisConfig() *RedisConfig {
	return &RedisConfig{
		Addr:     getEnv("REDIS_ADDR", "localhost:6379"),
		Password: getEnv("REDIS_PASSWORD", ""),
		DB:       getEnv("REDIS_DB", 0),
	}
}
