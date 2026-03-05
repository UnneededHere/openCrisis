# OpenCrisis: Modern Crisis Management for Model UN

Welcome to **OpenCrisis**, the open-source platform that brings your Model UN crisis committees into the modern age.

If you have ever run a crisis committee, you know the pain of managing hundreds of hand-written notes, running back and forth between rooms, shouting updates over the noise, and trying to keep track of a dozen plotlines in your head. It is chaotic, exhausting, and frankly, outdated.

**OpenCrisis changes that.** It digitises the entire backroom workflow, giving delegates a sleek dashboard to plot their schemes and staff a command centre to adjudicate them in real-time. No more lost notes. No more illegible handwriting. Just pure, fast-paced crisis.

For free!

---

## For the Host / Crisis Director

You want to run a seamless, high-tech conference. Here is what OpenCrisis does for you out of the box.

### What can it do?

*   **Streamlined Directives**: Delegates submit personal, joint, or cabinet directives through a clean digital form. You see them instantly in your queue.
*   **Real-Time Feedback**: Approve, deny, or request revisions with a click. Delegates see the status update instantly (no refresh needed!) along with your feedback.
*   **Secret Messaging**: Delegates can send private messages to other characters or the backroom. You can moderate these messages to ensure they fit the plot—or block them entirely.
*   **Instant Announcements**: Need to drop a breaking news update? Broadcast it to the entire committee in seconds. Mark it as "Urgent" to grab everyone's attention.
*   **Detailed Tracking**: Everything is logged. You can see exactly who did what and when, making end-of-conference awards a breeze.

### How do I set it up?

To test this out on your own computer (e.g., to show your Secretariat), follow these steps:

1.  **Install Docker Desktop**: Download and install it for your computer (Mac, Windows, or Linux).
2.  **Download OpenCrisis**: Download the code from this repository.
3.  **Run One Command**: Open your terminal (or command prompt), navigate to the folder, and type:
    ```bash
    docker-compose up
    ```
4.  **That is it.** Open your browser to `http://localhost:3000`.

### Initial Setup & First Login

When OpenCrisis starts for the first time, a default **admin account** is created automatically:

| Field    | Value               |
|----------|---------------------|
| Email    | `admin@example.com` |
| Password | `password123`       |

> **Important:** Change this password immediately after your first login.

Once logged in as admin, follow these steps to prepare your conference:

1.  **Create User Accounts**: Navigate to the **Admin Dashboard → Users** tab. Click **Create User** to add accounts for your staff (backroomers) and delegates. You set each user's email, password, name, and role (`Staff` or `Delegate`).
2.  **Create a Conference**: Go to the **Admin Dashboard → Conferences** tab. Click **New Conference** and give it a name and description.
3.  **Create Committees**: Switch to the **Committees** tab and click **New Committee**, assigning it to the conference you just created.
4.  **Assign Users to Committees**: Click on a committee to open its details. Use the **Assign User to Committee** form at the bottom to add staff and delegates. When assigning a delegate as a member, you will be asked for their **Character Name** (the character they will portray in the crisis).

### Going Live for the Conference

**Important:** The steps above only run the system on your personal laptop (`localhost`). For the actual conference, you need the system to be accessible to all delegates in the committee room.

To go live:

1.  **Rent a Server**: You will need a cloud server (VPS) from a provider like DigitalOcean, Linode, or AWS.
2.  **Install Docker**: Most providers offer a "One-Click Docker" image, or you can install it manually on the server.
3.  **Deploy**: Copy the code to your server and run the same `docker-compose up` command.
4.  **Connect**: Your delegates will then access the system via your server's IP address (e.g., `http://123.45.67.89:3000`) or a custom domain name if you configure one.

---

## Technical Architecture

OpenCrisis creates a unified real-time application using a monorepo structure. The system comprises three primary components: the client, the server, and a shared library.

### System Components

#### 1. Server Architecture (Backend)
The backend is built on **Node.js** with the **Express** framework, structured around a controller-service pattern.

*   **Database**: **MongoDB** is used as the primary data store. Mongoose schemas (`/server/src/models`) define the data structure for Users, Committees, Directives, and Messages.
*   **Communication**: Usage of a hybrid approach:
    *   **REST API**: Handles stateless creating, reading, updating, and deleting (CRUD) operations (e.g., login, submitting directives).
    *   **Socket.IO**: Maintains persistent WebSocket connections for real-time event propagation. Events such as `directive:created` or `message:new` are emitted to specific rooms (committees or user-specific channels) to trigger immediate UI updates.
*   **Authentication & Security**:
    *   **JWT Strategy**: Uses dual tokens—short-lived Access Tokens (15m) for API authorisation and long-lived Refresh Tokens (7d) for session maintenance.
    *   **RBAC Middleware**: Custom middleware enforces Role-Based Access Control at the route level, distinguishing between `admin`, `staff`, and `delegate` capabilities.
    *   **Validation**: Usage of **Zod** schemas to validate all incoming request bodies and query parameters. Validations are strict, ensuring data integrity before reaching the controller layer.

#### 2. Client Architecture (Frontend)
The frontend is a Single Page Application (SPA) built with **React** and **Vite**.

*   **State Management**:
    *   **TanStack Query**: Manages server state, caching, and optimistic updates.
    *   **Zustand**: Manages client-local state (e.g., authentication status, UI toggles).
*   **UI Framework**: **Material UI (MUI)** providing a responsive component library. Layouts are role-adaptive, rendering different navigation elements based on the authenticated user's role.
*   **Real-Time Integration**: A custom socket hook listens for backend events and automatically invalidates React Query caches, forcing a re-fetch of fresh data without user intervention.

#### 3. Shared Library
Located in `/shared`, this workspace exports TypeScript interfaces and Zod schemas used by both Client and Server. This ensures type safety across the network boundary; a change to a data model in the shared library propagates type errors to both frontend and backend during the build process.

### Data Flow Example: Directive Submission

1.  **Submission**: Client validates form data against the shared Zod schema.
2.  **API Request**: Client sends a POST request to `/api/directives`.
3.  **Server Validation**: Backend middleware re-validates the payload using the same Zod schema.
4.  **Persistence**: The Directive service creates a MongoDB document with `status: submitted`.
5.  **Event Emission**: The server emits a `directive:created` event via Socket.IO to the relevant committee room `staff` channel.
6.  **Real-Time Update**: Connected staff clients receive the event, invalidate their `directives` query cache, and automatically display the new directive in the queue.

### Deployment

The application is containerised using **Docker**. The `docker-compose.yml` orchestrates three services:

1.  `server`: The Node.js API (Port 5000).
2.  `client`: The Nginx server serving the React static build (Port 3000).
3.  `mongo`: The MongoDB database instance (Port 27017).

For production deployment, environment variables must be configured in `.env` files for both `client` and `server` directories to define secure secrets and connection strings.
