# SecurePay

An escrow platform for freelance social media work. A client deposits payment up front, the funds are held while the freelancer delivers, and they are released only when the client approves the work.

## The Problem

Freelance social media work often runs on trust. Clients worry about paying for work that never arrives, and freelancers worry about delivering and not getting paid. This app adds an escrow step so both sides are protected.

## How It Works

1. Client creates a job (description, deliverables, deadline, price)
2. Freelancer accepts the job
3. Client funds the escrow, and the money is held
4. Freelancer submits the work
5. Client approves, or requests changes
6. Funds are released to the freelancer on approval

## Features

- [Client and freelancer accounts]
- [Job creation and acceptance]
- [Escrow status tracking]
- [Payment integration: mock wallet]


## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React, Vite |
| Backend  | Python ([Flask ]) |
| Database | [PostgreSQL] |
| Tooling  | ESLint |


## Getting Started

### Prerequisites

- Node.js v18+
- Python 3.10+
- [Database setup]

### Installation

```bash
git clone https://github.com/[your-username]/[repo-name].git
cd [repo-name]
```

**Frontend**

```bash
npm install
npm run dev
```

**Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r ../requirements.txt
python [app.py / main.py]
```

### Environment variables

Create a `.env` file in `backend/`:

```
DATABASE_URL=
SECRET_KEY=
[PAYMENT_API_KEY=]
```

`.env` is gitignored and must never be committed.

## Project Structure

```
├── backend/            # Python API
├── src/                # React components and pages
├── public/             # Static assets
├── index.html
├── vite.config.js
├── requirements.txt
└── package.json
```

## Known Limitations

- [Payments are simulated / sandbox only]
- Not audited for real financial use
## License

[MIT]
