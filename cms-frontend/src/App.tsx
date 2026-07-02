import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Posts } from "@/pages/Posts";
import { PostEdit } from "@/pages/PostEdit";
import { Projects } from "@/pages/Projects";
import { ProjectEdit } from "@/pages/ProjectEdit";
import { Experiences } from "@/pages/Experiences";
import { ChatbotKnowledge } from "@/pages/ChatbotKnowledge";
import { MediaLibrary } from "@/pages/MediaLibrary";
import { AppLayout } from "@/components/layout/AppLayout";

function Protected({ children }: { children: JSX.Element }) {
  const token = useAuth((s) => s.token);
  const hydrate = useAuth((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="posts" element={<Posts />} />
        <Route path="posts/new" element={<PostEdit />} />
        <Route path="posts/:id" element={<PostEdit />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/new" element={<ProjectEdit />} />
        <Route path="projects/:id" element={<ProjectEdit />} />
        <Route path="experiences" element={<Experiences />} />
        <Route path="chatbot" element={<ChatbotKnowledge />} />
        <Route path="media" element={<MediaLibrary />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
