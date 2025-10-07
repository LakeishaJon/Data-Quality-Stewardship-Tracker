# 🧮 Data Quality & Stewardship Tracker
Full-Stack Web App | React | Node.js | Express | Supabase (PostgreSQL) | JWT

**📌 Overview**
The Data Quality & Stewardship Tracker is a full-stack web application designed to help teams track, evaluate, and improve data quality across datasets. Built with business analysts, data stewards, and technical users in mind, the system allows users to log issues, assign severity, track trends, and generate reports through a modern and user-friendly interface. This project highlights my skills in business analysis, data stewardship, and full-stack development.

**🎯  Features**

Dataset Management: Add, edit, and delete dataset records with key metadata

Data Quality Dimensions: Track accuracy, completeness, and timeliness scores

Issue Tracking: Log issues by type and owner

User Authentication: Secure login using Supabase Auth (JWT-based)

Real-time Updates: Automatic refresh of dashboards when data changes

Dashboard View: Summarized data quality scores and trends

**🧰 Tech Stack**

**Frontend:**

* React (Vite)

* TailwindCSS

* Recharts (for dashboards and visualization)

* Supabase JS client

**Backend / Database:**

* Supabase (PostgreSQL)

* Built-in authentication and API layer

* Hosted database with row-level security

**🌟 Highlights**
*	Demonstrates data stewardship workflow and quality tracking.
*	Combines business analysis + full-stack development.
*	Includes analytics visualization for actionable insights.

⚙️ Installation
### Clone the repo
git clone https://github.com/lakeishajon/data-quality-tracker.git
cd data-quality-tracker

### Backend setup
cd backend
npm install
cp .env.example .env
Add Supabase (PostgreSQL) URI and JWT secret in .env
node server.js
### Frontend setup
cd ../client
npm install
npm start


**📊 Future Enhancements**

* Role-based access (admin vs. steward)

* Data quality trend visualization by dataset

* Export to CSV / Excel

* Email or Slack notifications for new issues

* AI-powered suggestions for data improvement

👩‍💼 Author

Lakeisha Jones
Business Analyst | Aspiring Full Stack Engineer
📧 Contact: [lakeishajones780@gmail.com]

📝 License
MIT License
