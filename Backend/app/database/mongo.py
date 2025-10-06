from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from flask import current_app, g
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

# Global MongoDB client
_mongo_client = None
_mongo_db = None


def init_mongo(app):
    """Initialize MongoDB connection with Flask app."""
    global _mongo_client, _mongo_db
    
    try:
        # Build MongoDB URL from config values
        mongo_host = app.config.get('MONGO_HOST', 'localhost')
        mongo_port = app.config.get('MONGO_PORT', '27017')
        mongo_db = app.config.get('MONGO_DB', 'airquality_mongo')
        mongo_user = app.config.get('MONGO_USER', '')
        mongo_password = app.config.get('MONGO_PASSWORD', '')
        mongo_uri = app.config.get('MONGO_URI', '')
        
        # Use MONGO_URI if provided, otherwise build from components
        if mongo_uri:
            mongo_url = mongo_uri
        elif mongo_user and mongo_password:
            mongo_url = f"mongodb://{mongo_user}:{mongo_password}@{mongo_host}:{mongo_port}/{mongo_db}"
        else:
            mongo_url = f"mongodb://{mongo_host}:{mongo_port}/{mongo_db}"
        
        db_name = mongo_db
        
        logger.info(f"Connecting to MongoDB: {db_name}")
        
        # Create MongoDB client with connection options
        _mongo_client = MongoClient(
            mongo_url,
            serverSelectionTimeoutMS=5000,  # 5 second timeout
            connectTimeoutMS=10000,         # 10 second connection timeout
            maxPoolSize=50,                 # Maximum connections in pool
            retryWrites=True
        )
        
        # Test the connection
        _mongo_client.admin.command('ping')
        
        # Get database instance
        _mongo_db = _mongo_client[db_name]
        
        logger.info(f"MongoDB connection established successfully to database: {db_name}")
        
        # Create indexes for better performance
        _create_indexes()
        
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise Exception(f"MongoDB connection failed: {e}")
    except Exception as e:
        logger.error(f"Unexpected error initializing MongoDB: {e}")
        raise


def get_db():
    """
    Get MongoDB database instance.
    Returns the database instance for performing operations.
    """
    global _mongo_db
    
    if _mongo_db is None:
        raise Exception("MongoDB not initialized. Call init_mongo() first.")
    
    return _mongo_db


def get_client():
    """
    Get MongoDB client instance.
    Returns the client instance for advanced operations.
    """
    global _mongo_client
    
    if _mongo_client is None:
        raise Exception("MongoDB not initialized. Call init_mongo() first.")
    
    return _mongo_client


def close_connection():
    """Close MongoDB connection."""
    global _mongo_client, _mongo_db
    
    if _mongo_client:
        _mongo_client.close()
        _mongo_client = None
        _mongo_db = None
        logger.info("MongoDB connection closed")


def _create_indexes():
    """Create database indexes for better performance."""
    try:
        db = get_db()
        
        # User collection indexes
        db.users.create_index("email", unique=True)
        db.users.create_index("name")
        
        # AQI records collection indexes
        db.aqi_records.create_index([("lat", 1), ("lon", 1)])
        db.aqi_records.create_index("timestamp")
        db.aqi_records.create_index("source")
        db.aqi_records.create_index("pollutant")
        db.aqi_records.create_index([("lat", 1), ("lon", 1), ("timestamp", -1)])
        
        # Alerts collection indexes
        db.alerts.create_index("user_id")
        db.alerts.create_index("created_at")
        db.alerts.create_index([("user_id", 1), ("pollutant", 1)])
        
        logger.info("MongoDB indexes created successfully")
        
    except Exception as e:
        logger.warning(f"Failed to create some indexes: {e}")


# Health check function
def check_connection():
    """Check if MongoDB connection is healthy."""
    try:
        client = get_client()
        client.admin.command('ping')
        return True
    except Exception as e:
        logger.error(f"MongoDB health check failed: {e}")
        return False


# Database utilities
class MongoUtils:
    """Utility functions for MongoDB operations."""
    
    @staticmethod
    def to_dict(document):
        """Convert MongoDB document to dictionary."""
        if document is None:
            return None
        
        # Convert ObjectId to string
        if '_id' in document:
            document['_id'] = str(document['_id'])
        
        return document
    
    @staticmethod
    def to_dict_list(documents):
        """Convert list of MongoDB documents to list of dictionaries."""
        return [MongoUtils.to_dict(doc) for doc in documents]
    
    @staticmethod
    def prepare_for_insert(data):
        """Prepare data for MongoDB insertion."""
        # Remove _id if it's None or empty string
        if '_id' in data and not data['_id']:
            del data['_id']
        
        return data
