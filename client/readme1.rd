
## README.md Structure for Your Project

```markdown
# PRChat - Real-time Chat Application

A real-time chat application built with React (Next.js), Node.js, Socket.io, and MongoDB, deployed on Vercel. This project allows users to engage in real-time conversations, with features like message search and reply functionality.

## Features

- **Real-time Messaging:** Instant message delivery and receipt.
- **Message Search:** Users can search for specific text within their conversations, enhancing information retrieval.
- **Reply-to-Message:** Users can reply directly to specific messages, maintaining context and improving conversation flow.
- **Group Chats:** Create and participate in group conversations.
- **Direct Messages:** One-on-one conversations.
- **User Authentication:** Secure login and registration.
- **Typing Indicators:** See when other users are typing.
- **Message Notifications:** Receive alerts for new messages.

## Tech Stack

**Frontend:** React (Next.js), Chakra UI, Socket.io-client
**Backend:** Node.js, Express.js
**Database:** MongoDB (Requires a hosted instance, e.g., MongoDB Atlas)
**Real-time Communication:** Socket.io
**Deployment:** Vercel

## Project Structure

This project is structured as a monorepo with distinct frontend and backend applications:

```

prchat/
├── client/          \# Next.js frontend application
│   ├── pages/
│   ├── components/
│   ├── context/
│   ├── config/
│   ├── animations/
│   ├── public/
│   ├── package.json \# Frontend dependencies
│   └── ...
├── controllers/     \# Express.js backend controllers
├── middleware/      \# Express.js middleware
├── models/          \# Mongoose database models (User, Chat, Message)
├── routes/          \# Express.js API routes
├── server.js        \# Express.js server entry point
├── package.json     \# Backend dependencies
├── .env             \# Environment variables (JWT\_SECRET, MONGO\_URI, etc.)
└── docker-compose.yml \# Optional: for local development setup

````

## Getting Started

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/CHANDAN-M-J/prchat.git](https://github.com/CHANDAN-M-J/prchat.git)
    cd prchat
    ```

2.  **Install Dependencies:**
    * **Backend:**
        ```bash
        npm install
        ```
    * **Frontend (inside client directory):**
        ```bash
        cd client
        npm install
        cd ..
        ```

3.  **Environment Variables:**
    Create a `.env` file in the root of the `prchat` directory and configure your environment variables:
    ```env
    # Backend Environment Variables
    PORT=5000
    MONGO_URI=your_mongodb_connection_string # e.g., mongodb+srv://<user>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority
    JWT_SECRET=your_super_secret_jwt_key # Generate a strong, unique secret
    JWT_EXPIRE=2d
    NODE_ENV=development

    # Frontend Environment Variables (if using Next.js for client-side secrets)
    # NEXT_PUBLIC_API_URL=http://localhost:5000 # Or your deployed backend URL
    ```
    **Important:** For `MONGO_URI` and `JWT_SECRET`, use secure values. For `JWT_SECRET`, generate a strong random string.

4.  **Run the Application:**
    * **Terminal 1 - Backend:**
        ```bash
        npm run server
        ```
    * **Terminal 2 - Frontend:**
        ```bash
        npm run client
        ```

### Test Users

Pre-configured test accounts for local development:
- `test1@example.com` / `password123`
- `test2@example.com` / `password123`
- `test3@example.com` / `password123`
- `guest@example.com` / `123456`

---

## Deployment on Vercel

This project uses a monorepo structure and can be deployed on Vercel.

### Backend Deployment (Node.js/Express.js)

1.  **Push your code:** Ensure all your latest changes, including the implemented features, are pushed to your GitHub repository:
    ```bash
    git push -u origin message-add
    ```

2.  **Connect Vercel to your GitHub repo:**
    * Sign up or log in to your Vercel account.
    * Create a new project and select your forked repository (`CHANDAN-M-J/prchat`).

3.  **Configure Vercel Build Settings:**
    * Vercel typically detects monorepos. You might need to specify the build commands and output directories.
    * **For the Backend:** Vercel will likely identify the `server.js` file as your application entry point.
        * **Build Command:** `npm install && npm run build` (or similar if you have a build script for your backend, though typically not needed for Node.js apps unless transpiling).
        * **Output Directory:** Usually not applicable for Node.js backend deployments on Vercel, as it runs serverless functions.
        * **Root Directory:** You might need to specify the root of your backend application if it's not at the top level. Vercel might prompt you to set this to the `prchat` directory.

4.  **Environment Variables:**
    In your Vercel project settings, navigate to **Environment Variables**. Add the following:
    * `MONGO_URI`: Your MongoDB connection string (e.g., from MongoDB Atlas). **This is crucial.**
    * `JWT_SECRET`: A strong, randomly generated secret string.
    * `PORT`: Set to `3000` (Vercel assigns this to serverless functions).
    * `NODE_ENV`: Set to `production`.

5.  **Deploy:** Trigger a new deployment on Vercel. Vercel will build and deploy your backend as serverless functions.

### Frontend Deployment (Next.js/React)

Vercel excels at deploying Next.js applications.

1.  **Configure Vercel for Frontend:** When you connect Vercel to your monorepo, it should automatically detect the Next.js app within the `client/` directory.
    * **Root Directory:** Vercel should automatically set this to `client/`. If not, manually select it.
    * **Build Command:** Vercel will likely use `npm run build` (or `yarn build`) for Next.js.
    * **Output Directory:** Vercel will handle this for Next.js.

2.  **Frontend Environment Variables:**
    Any environment variables needed by your Next.js frontend (e.g., for API URLs) should be prefixed with `NEXT_PUBLIC_` and added in Vercel's Environment Variables section.
    * `NEXT_PUBLIC_API_URL`: Set this to your deployed backend URL (e.g., `https://your-backend-app-name.vercel.app` or your custom domain).

3.  **Deploy:** Vercel will build and deploy your Next.js frontend.

**Important Notes on Monorepo Deployment:**
* **Separate Deployments:** It's common to deploy the backend and frontend as separate projects on Vercel, even if they are in the same monorepo. This provides better control and isolation.
    * You might need to create two Vercel projects: one for the backend (pointing to the `prchat` directory) and one for the frontend (pointing to the `prchat/client` directory).
* **API URL Configuration:** Ensure your frontend correctly points to the deployed backend API URL. You'll likely configure this via the `NEXT_PUBLIC_API_URL` environment variable in Vercel for the frontend project.

---

## Additional Features (Implementation Details)

### Message Search

* **Frontend:** Implemented in `SingleChat.jsx`. A search input filters the displayed messages client-side based on the `content` field. The `filteredMessages` state is used to update the `ScrollableChat` component.
* **Backend:** No changes needed. The `allMessages` API endpoint provides all necessary message data.

### Message Actions (Copy & Reply)

* **Frontend:**
    * **Copy:** Implemented in `ScrollableChat.jsx` using `navigator.clipboard.writeText()`.
    * **Reply:** Implemented in `ScrollableChat.jsx` (for the UI trigger) and `SingleChat.jsx` (for handling the reply state and formatting the message content before sending).
* **Backend:** No changes needed. The `sendMessage` API endpoint handles arbitrary message content, so formatted reply messages are sent as plain text.

---

## Contributing

If you wish to contribute to this project, please follow these steps:

1.  **Fork the repository.**
2.  **Clone your fork:** `git clone https://github.com/CHANDAN-M-J/prchat.git`
3.  **Create a new branch:** `git checkout -b your-branch-name`
4.  **Make your changes** and commit them.
5.  **Push to your fork:** `git push origin your-branch-name`
6.  **Create a Pull Request** from your branch to the `main` branch of the original repository.

