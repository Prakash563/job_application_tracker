# 🚀 Career Compass — AI-Powered Job Application Tracker

**Career Compass** is a modern full-stack web application that helps job seekers organize, track, and improve their job search journey. Instead of managing applications through spreadsheets and scattered notes, Career Compass provides a centralized platform to monitor every stage of the hiring process, manage resumes, analyze skill gaps, and visualize progress through insightful analytics.

This project also serves as a **portfolio showcase**, allowing recruiters to explore the application without creating an account while offering a fully featured production version for authenticated users.

---

## 🌟 Live Demo

Choose the experience that best fits your needs.

| Version | Best For | Description |
|---------|----------|-------------|
| 🌐 **Recruiter Demo (GitHub Pages)** | Recruiters & Hiring Managers | Explore the application instantly without signing in. All data is stored locally in your browser. |
| 🔐 **Production Application** | Real Users | Secure authentication, cloud storage, analytics, and AI-powered features. |

### 🔗 Recruiter Demo

**Live Demo:**  
https://prakash563.github.io/job_application_tracker/

> **Note:**  
> The GitHub Pages demo is intentionally browser-only. It does not collect personal information, upload resumes, or store any data remotely.

---

# ✨ Features

## 📋 Job Application Tracking

Manage every job application from start to finish.

- Save interesting job opportunities
- Track submitted applications
- Monitor interview progress
- Manage job offers
- Record rejected applications
- Withdraw applications when needed

Supported workflow:

- Saved
- Applied
- Interview
- Offer
- Rejected
- Withdrawn

---

## 📄 Resume Management

The production version provides secure resume management.

- Upload multiple resumes
- Store resume files securely in AWS S3
- Associate resumes with applications
- Maintain resume metadata in the database

---

## 🎯 AI Skill Gap Analysis

Compare your resume against job descriptions.

Features include:

- Skill overlap detection
- Missing skill identification
- Match percentage calculation
- Optional AI-generated explanations

---

## 📊 Analytics Dashboard

Visualize your job search performance through interactive analytics.

- Applications submitted per month
- Status distribution
- Response rate
- Interview conversion rate
- Overall application progress

---

## 🔒 Authentication & Security

The production application includes:

- Manus OAuth authentication
- Protected tRPC procedures
- User-specific workspaces
- Secure cloud storage
- Private database records

---

# 🖥️ Recruiter Demo vs Production

| Feature | Recruiter Demo | Production |
|---------|----------------|------------|
| Login Required | ❌ No | ✅ Yes |
| Local Storage | ✅ Browser Only | ❌ |
| Database | ❌ | ✅ |
| Resume Upload | ❌ | ✅ AWS S3 |
| Authentication | ❌ | ✅ Auth |
| AI Skill Analysis | Basic | Advanced |
| Analytics | Browser Based | Server Powered |
| User Data Persistence | Local Browser | Cloud Database |

---

# 🏗️ Project Documentation

The repository also contains detailed documentation to better understand the architecture and implementation.

| Document | Description |
|----------|-------------|
| `docs/PROJECT_WORKFLOW.md` | Complete application workflow |
| `docs/IMPLEMENTATION_NOTES.md` | Technical decisions and implementation details |
| `docs/RECRUITER_DEMO.md` | GitHub Pages demo guide |
| `docs/architecture.png` | Full system architecture diagram |

---

# ⚙️ Getting Started

Clone the repository:

```bash
git clone https://github.com/Prakash563/job_application_tracker.git

cd job_application_tracker
```

Install dependencies:

```bash
pnpm install
```

---

## ▶️ Run the Production Application

```bash
pnpm dev
pnpm test
pnpm check
```

---

## 🌐 Run the GitHub Pages Demo

```bash
pnpm dev:pages
pnpm build:pages
pnpm preview:pages
```

---

# 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- Vite

### Backend

- Node.js
- tRPC
- Manus OAuth

### Database & Storage

- Relational Database
- AWS S3

### Additional Technologies

- AI-assisted Skill Gap Analysis
- Analytics Dashboard
- Browser Local Storage
- Cloud Persistence

---

# 🎯 Why Career Compass?

Searching for jobs can quickly become overwhelming when applications, resumes, interview schedules, and notes are scattered across different platforms.

Career Compass simplifies the entire process by bringing everything into one intuitive dashboard, enabling users to:

- Stay organized
- Track application progress
- Manage resumes efficiently
- Analyze resume-job compatibility
- Measure job search success through analytics

---

# 👨‍💻 About This Project

Career Compass was developed as a portfolio project to demonstrate modern full-stack development skills, including authentication, cloud storage integration, analytics, AI-assisted functionality, and responsive user experience—all while solving a real-world problem faced by students and professionals during their job search.

---

## ⭐ Support the Project

If you found this project useful or interesting, consider giving it a **⭐ Star** on GitHub.

Your support helps increase the visibility of the project and motivates future improvements.

---

**Made with ❤️ by Prakash Dora**

