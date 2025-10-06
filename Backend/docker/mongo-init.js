// MongoDB initialization script for production
db = db.getSiblingDB('airquality_prod');

// Create collections with validation
db.createCollection('users', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'email', 'created_at'],
            properties: {
                name: { bsonType: 'string' },
                email: { bsonType: 'string' },
                password: { bsonType: 'string' },
                preferences: { bsonType: 'object' },
                created_at: { bsonType: 'date' },
                updated_at: { bsonType: 'date' }
            }
        }
    }
});

db.createCollection('aqi_records', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['lat', 'lon', 'source', 'pollutant', 'value', 'timestamp'],
            properties: {
                lat: { bsonType: 'double' },
                lon: { bsonType: 'double' },
                source: { bsonType: 'string' },
                pollutant: { bsonType: 'string' },
                value: { bsonType: 'double' },
                timestamp: { bsonType: 'date' },
                metadata: { bsonType: 'object' },
                created_at: { bsonType: 'date' }
            }
        }
    }
});

db.createCollection('alerts', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['user_id', 'pollutant', 'threshold', 'active'],
            properties: {
                user_id: { bsonType: 'objectId' },
                pollutant: { bsonType: 'string' },
                threshold: { bsonType: 'double' },
                location: { bsonType: 'object' },
                notification_methods: { bsonType: 'array' },
                active: { bsonType: 'bool' },
                created_at: { bsonType: 'date' },
                updated_at: { bsonType: 'date' },
                last_triggered: { bsonType: 'date' },
                trigger_count: { bsonType: 'int' }
            }
        }
    }
});

// Create indexes for performance
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'name': 1 });

db.aqi_records.createIndex({ 'lat': 1, 'lon': 1 });
db.aqi_records.createIndex({ 'timestamp': -1 });
db.aqi_records.createIndex({ 'source': 1 });
db.aqi_records.createIndex({ 'pollutant': 1 });
db.aqi_records.createIndex({ 'lat': 1, 'lon': 1, 'timestamp': -1 });
db.aqi_records.createIndex({ 'pollutant': 1, 'timestamp': -1 });

db.alerts.createIndex({ 'user_id': 1 });
db.alerts.createIndex({ 'created_at': -1 });
db.alerts.createIndex({ 'user_id': 1, 'pollutant': 1 });
db.alerts.createIndex({ 'active': 1 });

print('MongoDB initialization completed successfully');
