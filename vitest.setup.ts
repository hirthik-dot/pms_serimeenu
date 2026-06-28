process.env.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-minimum-32-characters!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-minimum-32-characters!';
