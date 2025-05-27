import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate, Outlet } from "react-router-dom";

import { AddCourse, Course, Courses, EditCourse } from "pages/course";
import { User } from "pages/user";
import { Auth } from "pages/auth"

const PrivateRoute = () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        return <Navigate to="/auth" replace state={{ from: "protected", reason: "not-authenticated" }} />;
    }

    return <Outlet />;
};

const routes = createRoutesFromElements(
    <>
        <Route element={<PrivateRoute />}>
            <Route path="/" element={<Courses />} />
            <Route path="/course/add" element={<AddCourse />} />
            <Route path="/course/edit/:id" element={<EditCourse />} />
            <Route path="/course/:id" element={<Course />} />
            <Route path="/user/:id" element={<User />} />
        </Route>
        <Route path="/auth" element={<Auth />} />
    </>
)

export const AppRouter = () => {
    const router = createBrowserRouter(routes);
    return <RouterProvider router={router} />
}