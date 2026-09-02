# MediSummarize 🏥

MediSummarize is an AI-powered medical report management application that helps patients upload their previous medical reports and helps doctors quickly understand the important information contained in those reports.

The application extracts text from uploaded PDFs and uses **Google Gemini AI** to generate a concise summary of the report.

> **Note:** The AI only summarizes information present in the uploaded report. It does not provide diagnosis, treatment recommendations, or medical advice.

---

## 🚀 Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js
* REST API

### Database

* MongoDB
* Mongoose

### AI

* Google Gemini API

### Other

* PDF text extraction
* Browser MediaRecorder API for audio input

---

## 👤 Patient Portal

Patients can:

* Enter their basic information
* Provide their problem in **Hindi or English**
* Describe their problem using **text or audio**
* Upload previous medical reports in PDF format
* View upload/processing status

### Medical Report Processing

```text
Patient uploads PDF
        ↓
Backend extracts text
        ↓
Extracted text sent to Gemini
        ↓
Gemini generates summary
        ↓
Summary stored in MongoDB
        ↓
Doctor can view the summary
```

---

## 👨‍⚕️ Doctor Portal

Doctors can:

* Login to the doctor portal
* View all patients
* Search patients
* Open individual patient profiles
* View patient information
* View the patient's reported problem
* View uploaded medical reports
* View extracted report text
* View Gemini-generated summaries

---

## 🏗️ Architecture

```text
                ┌─────────────────┐
                │     Patient     │
                │    / Doctor     │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ React Frontend  │
                └────────┬────────┘
                         │
                      REST API
                         │
                         ▼
                ┌─────────────────┐
                │ Express Backend │
                └──────┬─────┬────┘
                       │     │
              ┌────────┘     └─────────┐
              ▼                        ▼
       ┌─────────────┐          ┌─────────────┐
       │   MongoDB   │          │ PDF Parser  │
       └─────────────┘          └──────┬──────┘
                                       │
                                       ▼
                                ┌─────────────┐
                                │ Gemini API  │
                                └─────────────┘
```

---

## 📋 Prerequisites

Make sure the following are installed:

* **Node.js**
* **npm**
* **MongoDB**

You will also need a **Google Gemini API key**.

---

# ⚙️ Installation & Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

```bash
cp .env.example .env
```

Open the `.env` file and add:

```env
GEMINI_API_KEY=yaha_pe_apna_gemini_api_key_daalna

MONGODB_URI=mongodb://localhost:27017/medisummarize

# Server Port (default: 3000)
PORT=3000

# Doctor Portal Demo PIN / Credentials
DOCTOR_PIN=1234
```

Replace:

```text
yaha_pe_apna_gemini_api_key_daalna
```

with your actual Gemini API key.

### 3. Start MongoDB

Make sure MongoDB is installed and running locally.

The application uses:

```text
mongodb://localhost:27017/medisummarize
```

You can also use **MongoDB Compass** to view the database.

### 4. Start the application

```bash
npm run dev
```

The application will start on the configured port.

---


