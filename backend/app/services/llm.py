import logging
import asyncio
from typing import Optional, Dict, Any
import google.generativeai as genai
from groq import Groq
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.config import settings
from app.core.logging import get_trace_id

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        # Initialize Gemini
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Initialize Groq
        self.groq_client = None
        if settings.GROQ_API_KEY:
            self.groq_client = Groq(api_key=settings.GROQ_API_KEY)

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        trace_id = get_trace_id()
        
        # Try primary provider with retry
        try:
            return await self._call_with_retry(
                provider=settings.PRIMARY_PROVIDER,
                prompt=prompt,
                system_prompt=system_prompt
            )
        except Exception as e:
            logger.error(f"[TraceID: {trace_id}] Primary provider ({settings.PRIMARY_PROVIDER}) failed after retries: {e}")
            
            # Fallback to secondary if configured and different
            if settings.FALLBACK_PROVIDER and settings.FALLBACK_PROVIDER != settings.PRIMARY_PROVIDER:
                logger.info(f"[TraceID: {trace_id}] Attempting fallback to {settings.FALLBACK_PROVIDER}")
                try:
                    return await self._call_with_retry(
                        provider=settings.FALLBACK_PROVIDER,
                        prompt=prompt,
                        system_prompt=system_prompt
                    )
                except Exception as fe:
                    logger.error(f"[TraceID: {trace_id}] Fallback provider ({settings.FALLBACK_PROVIDER}) also failed: {fe}")
                    raise fe
            raise e

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((Exception)), # Broad for now, can be narrowed
        reraise=True
    )
    async def _call_with_retry(self, provider: str, prompt: str, system_prompt: Optional[str] = None) -> str:
        logger.info(f"Calling LLM provider: {provider}")
        if provider == "gemini":
            return await self._call_gemini(prompt, system_prompt)
        elif provider == "groq":
            return await self._call_groq(prompt, system_prompt)
        else:
            raise ValueError(f"Unknown LLM provider: {provider}")

    async def _call_gemini(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        model_name = settings.GEMINI_MODEL
        model = genai.GenerativeModel(
            model_name=model_name,
            generation_config={"temperature": settings.LLM_TEMPERATURE}
        )
        
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, 
            lambda: model.generate_content(full_prompt)
        )
        if not response or not response.text:
            raise ValueError("Empty response from Gemini")
        return response.text

    async def _call_groq(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.groq_client:
            raise ValueError("Groq client not initialized (missing API key)")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        loop = asyncio.get_event_loop()
        completion = await loop.run_in_executor(
            None,
            lambda: self.groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=messages,
                temperature=settings.LLM_TEMPERATURE,
                timeout=20.0
            )
        )
        if not completion or not completion.choices:
            raise ValueError("Empty response from Groq")
        return completion.choices[0].message.content

llm_service = LLMService()
