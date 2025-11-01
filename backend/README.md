# Introductionn
This repository contains the backend for a project-centric chat application, built with Node.js, Express, and MongoDB. It provides user, organization, team, project, and chat management, with a pluggable LLM integration (currently wired to Azure/GitHub‑AI for testing).

---

## 🚀 Key Features

1. **User Management**

   * Pending-user registration with email verification codes
   * Email-based verification and password hashing (bcrypt)
   * JWT-based authentication (login/logout)
   * Role-based access control (`user`, `team_admin`, `superadmin`)

2. **Organization & Team Management**

   * Create, read, update, delete organizations
   * Invite, promote, and remove team members
   * Per-organization isolation and authorization checks

3. **Project Management**

   * CRUD operations for projects scoped under teams
   * Auto-provisioned chat channel on project creation

4. **Chat Subsystem**

   * Persist text and optional image messages in MongoDB
   * Route user messages to your ML team’s LLM (development uses Azure/GitHub‑AI)
   * Store AI replies with optional confidence scores
   * Endpoints for sending messages and fetching full chat history

---

## 🛠 Tech Stack

* **Language & Framework**: Node.js, Express
* **Database**: MongoDB with Mongoose ODM
* **Authentication**: JSON Web Tokens (JWT)
* **Security**: bcrypt for password hashing
* **Email Service**: Nodemailer (Gmail SMTP)
* **LLM Integration**: Abstract client; Azure/GitHub‑AI used for testing
* **Configuration**: dotenv

---

## ⚙️ Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Uditgupta08/Capstone-Project.git
   cd Capstone-Project
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the server**

   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

Server will start on `http://localhost:${process.env.PORT}` by default.
