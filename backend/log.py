import os
import sys
import logging
from datetime import datetime
from loguru import logger

class Log:
    """
    Custom logger using loguru that writes to both file and stderr.
    Includes interception for standard library logging (like uvicorn).
    """
    def __init__(self, log_directory="logs"):
        self.log_directory = log_directory
        os.makedirs(self.log_directory, exist_ok=True)
        self.log_file = os.path.join(self.log_directory, f"log_{datetime.now().strftime('%Y-%m-%d')}.log")

        # Configuration for Loguru
        logger.remove()  # Clear existing handlers
        
        # File handler
        logger.add(
            self.log_file,
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {module}:{function}:{line} - {message}",
            level="DEBUG",
            encoding="utf-8",
            rotation="10 MB",
            retention="1 month"
        )
        
        # Custom level icons for a premium feel
        logger.level("INFO", icon="ℹ️")
        logger.level("SUCCESS", icon="✅")
        logger.level("WARNING", icon="⚠️")
        logger.level("ERROR", icon="❌")
        logger.level("CRITICAL", icon="🔥")
        logger.level("DEBUG", icon="🔍")

        # Terminal handler with icons and vibrant colors
        logger.add(
            sys.stderr,
            format="<green>{time:HH:mm:ss}</green> | <level>{level.icon} {level: <8}</level> | <cyan>{module}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            level="INFO",
            colorize=True
        )

        # Intercept standard logging (uvicorn, etc.)
        class InterceptHandler(logging.Handler):
            def emit(self, record):
                try:
                    level = logger.level(record.levelname).name
                except ValueError:
                    level = record.levelno

                frame, depth = sys._getframe(6), 6
                while frame and frame.f_code.co_filename == logging.__file__:
                    frame = frame.f_back
                    depth += 1

                logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

        # Reset standard logging to use our InterceptHandler
        logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

    def log_info(self, message):
        logger.info(message)

    def log_warning(self, message):
        logger.warning(message)

    def log_error(self, message):
        logger.error(message)

    def log_critical(self, message):
        logger.critical(message)

    def log_debug(self, message):
        logger.debug(message)

    def log_exception(self, message, exception=None):
        if exception is not None:
            logger.exception(f"{message}: {exception}")
        else:
            logger.exception(message)

# Global instance for project-wide use
log_tool = Log()
