import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

logger = logging.getLogger(__name__)

class BackgroundScheduler:
    def __init__(self):
        self.tasks = []
    
    async def repeat_every(self, seconds: int, func, *args, **kwargs):
        """Repeat a function every specified seconds"""
        while True:
            try:
                await func(*args, **kwargs)
            except Exception as e:
                logger.error(f"Background task failed: {e}")
            await asyncio.sleep(seconds)
    
    def add_task(self, seconds: int, func, *args, **kwargs):
        """Add a background task"""
        task = asyncio.create_task(self.repeat_every(seconds, func, *args, **kwargs))
        self.tasks.append(task)
    
    async def shutdown(self):
        """Cancel all background tasks"""
        for task in self.tasks:
            task.cancel()
        await asyncio.gather(*self.tasks, return_exceptions=True)

# Global scheduler instance
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize background tasks
    # Example: scheduler.add_task(3600, cleanup_old_data)  # Every hour
    yield
    # Shutdown: Clean up tasks
    await scheduler.shutdown()
