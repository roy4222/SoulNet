import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import firebase from '../utils/firebase';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export default function NewPost() {
    return (
        <div>
            <h1>新文章</h1>
        </div>
    );
}