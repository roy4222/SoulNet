import React from "react";
import firebase from "../utils/firebase";

export default function Topics() {
    return (
        <div>
            <h1>Topics</h1>
            <ul>
                {topics.map((topic) => (
                    <li key={topic.id}>{topic.title}</li>
                ))}
            </ul>
        </div>
    );
}