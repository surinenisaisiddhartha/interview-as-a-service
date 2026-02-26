import os
from datetime import datetime
from loguru import logger
import sys

class Log:
    def __init__(self, log_directory="logs"):
        """
        Initializes the Log class, creating a log directory and configuring the logger.

        Args:
            log_directory (str): The directory where log files will be stored.
        """
        self.log_directory = log_directory
        os.makedirs(self.log_directory, exist_ok=True)
        self.log_file = os.path.join(self.log_directory, f"log_{datetime.now().strftime('%Y-%m-%d')}.log")

        logger.remove()  # Remove default handler
        logger.add(self.log_file, format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {module}.{function}:{line} - {message}", level="DEBUG", encoding="utf-8", backtrace=True, diagnose=True)
        logger.add(sys.stdout, format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {module}.{function}:{line} - {message}", level="DEBUG", backtrace=True, diagnose=True)

        class StreamToLog:
            def write(self, message):
                message = message.strip()
                if message:  # Avoid empty lines
                    logger.warning(message)

            def flush(self):  # Required for file-like objects
                pass

        sys.stderr = StreamToLog()
        
    def log_info(self, message):
        """Logs an informational message."""
        logger.info(message)

    def log_warning(self, message):
        """Logs a warning message."""
        logger.warning(message)

    def log_error(self, message):
        """Logs an error message (without exception traceback)."""
        logger.error(message)

    def log_critical(self, message):
        """Logs a critical error message."""
        logger.critical(message)

    def log_debug(self, message):
        """Logs a debug message."""
        logger.debug(message)

    def log_exception(self, message, exception=None):
        """Logs an exception with a custom message and optional exception (captures traceback)."""
        if exception is not None:
            logger.exception(f"{message}: {exception}")
        else:
            logger.exception(message)

log_tool = Log()        
