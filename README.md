# Anime Recommender (MongoDB + Streamlit)

A high-performance anime recommendation web app built with: - MongoDB
(data storage) - Streamlit (backend + UI container) - Custom HTML/JS
frontend (search + recommendation UI)

------------------------------------------------------------------------

## 🚀 Features

-   🔍 Search anime instantly (client-side)
-   📊 Tag-based similarity recommendations
-   ⚡ Fast performance (preloaded dataset + caching)
-   🎨 Custom UI (not standard Streamlit widgets)
-   🗄️ MongoDB backend integration
-   🔒 Secure secrets handling

------------------------------------------------------------------------

## 📁 Project Structure

    .
    ├── .streamlit/
    │   └── secrets.toml
    ├── anime_final/
    │   ├── streamlit_app.py
    │   ├── db.py
    │   ├── webapp_template.py
    │   ├── anime_similarity_top50_rank.json
    ├── requirements.txt
    └── README.md

------------------------------------------------------------------------

## ⚙️ Setup

### Install dependencies

    pip install -r requirements.txt

### Setup secrets

Create `.streamlit/secrets.toml`:

    MONGODB_URI = "your-mongodb-uri"

------------------------------------------------------------------------

## ▶️ Run locally

    streamlit run anime_final/streamlit_app.py

------------------------------------------------------------------------

## ☁️ Deploy

-   Use Streamlit Cloud
-   Set entry file: `anime_final/streamlit_app.py`
-   Add secrets in dashboard

------------------------------------------------------------------------

## 🧠 Architecture

MongoDB → Backend → HTML Template → Browser

------------------------------------------------------------------------

## ⚠️ Notes

-   Search runs on frontend (no backend query per keystroke)
-   Full dataset loads once

------------------------------------------------------------------------

## 👤 Author

Mehaan Ahuja
