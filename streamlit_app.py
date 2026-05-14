import streamlit as st
import os
import subprocess

st.title("AI Travel Planner - Backend Server")
st.write("This repository contains the FastAPI backend for the AI Travel Planner.")
st.write("Note: Streamlit Cloud is typically used for frontend UIs. For a FastAPI backend, it is recommended to deploy on Render, Railway, or Heroku.")

# Optional: A hacky way to start the FastAPI server in the background (Not recommended for production)
st.write("---")
if st.button("Start FastAPI Backend (Development Only)"):
    st.write("Starting FastAPI server on port 8000...")
    subprocess.Popen(["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"])
    st.success("FastAPI server started in the background!")
