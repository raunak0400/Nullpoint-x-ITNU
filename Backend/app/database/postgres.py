import psycopg2
from psycopg2.extras import RealDictCursor
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class PostgresConnection:
    """PostgreSQL database connection manager."""
    
    def __init__(self, app=None):
        self.app = app
        self.connection = None
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize PostgreSQL connection with Flask app."""
        self.app = app
        app.teardown_appcontext(self.close_connection)
    
    def get_connection(self):
        """Get PostgreSQL connection."""
        if self.connection is None or self.connection.closed:
            try:
                self.connection = psycopg2.connect(
                    host=self.app.config['POSTGRES_HOST'],
                    port=self.app.config['POSTGRES_PORT'],
                    database=self.app.config['POSTGRES_DB'],
                    user=self.app.config['POSTGRES_USER'],
                    password=self.app.config['POSTGRES_PASSWORD'],
                    cursor_factory=RealDictCursor
                )
                logger.info("PostgreSQL connection established")
            except Exception as e:
                logger.error(f"Failed to connect to PostgreSQL: {e}")
                raise
        return self.connection
    
    def close_connection(self, exception):
        """Close PostgreSQL connection."""
        if self.connection and not self.connection.closed:
            self.connection.close()
            logger.info("PostgreSQL connection closed")


# Global instance
postgres_db = PostgresConnection()


def init_postgres(app):
    """Initialize PostgreSQL with Flask app."""
    postgres_db.init_app(app)
    logger.info("PostgreSQL initialized")
