import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom";

import { AddCourse, Course, Courses, EditCourse } from "pages/course";
import { User } from "pages/user";
const routes = createRoutesFromElements(
    <>
        <Route path="/" element={<Courses />} />
        <Route path="/course/add" element={<AddCourse />} />
        <Route path="/course/edit" element={<EditCourse />} />
        <Route path="/course/:id" element={<Course />} />
        <Route path="/user" element={<User />} />
    </>
)

export const AppRouter = () => {
    const router = createBrowserRouter(routes);
    return <RouterProvider router={router} />
}