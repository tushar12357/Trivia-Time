import React, { useState, useEffect } from 'react';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import questionsData from './questions.json'; // Import the JSON file
import './App.css';

const App = () => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timer, setTimer] = useState(0); // Initialize timer to 0
    const [answers, setAnswers] = useState({});
    const [isQuizStarted, setIsQuizStarted] = useState(false); // Track if quiz has started
    const [isQuizFinished, setIsQuizFinished] = useState(false);
    const handle = useFullScreenHandle();

    useEffect(() => {
        // Load questions from JSON file
        setQuestions(questionsData);

        // Load state from localStorage
        const savedState = JSON.parse(localStorage.getItem('quizState'));
        if (savedState) {
            setCurrentQuestionIndex(savedState.currentQuestionIndex);
            setTimer(savedState.timer);
            setAnswers(savedState.answers);
            setIsQuizStarted(savedState.isQuizStarted);
            setIsQuizFinished(savedState.isQuizFinished);
        } else {
            // If no saved state, initialize the quiz
            setIsQuizStarted(false);
            setIsQuizFinished(false);
            setCurrentQuestionIndex(0);
            setTimer(0);
            setAnswers({});
        }
    }, []);

    useEffect(() => {
        // Save state to localStorage
        localStorage.setItem('quizState', JSON.stringify({
            currentQuestionIndex,
            timer,
            answers,
            isQuizStarted,
            isQuizFinished
        }));
    }, [currentQuestionIndex, timer, answers, isQuizStarted, isQuizFinished]);

    const startQuiz = () => {
        setIsQuizStarted(true);
        const enterFullScreen = handle.enter;
        if (enterFullScreen) {
            enterFullScreen(); // Enter full screen
        }
        setTimer(600); // Start timer (10 minutes)
        const interval = setInterval(() => {
            setTimer(prevTimer => {
                if (prevTimer <= 0) {
                    clearInterval(interval);
                    finishQuiz();
                    return 0;
                }
                return prevTimer - 1;
            });
        }, 1000);
    };

    const handleAnswer = (answer) => {
        if (!handle.active) return; // Do nothing if not in full screen
        setAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: answer
        }));
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        setIsQuizFinished(true);
        localStorage.removeItem('quizState');
        handle.exit(); // Exit full screen when quiz finishes
    };

    const calculateScore = () => {
        return questions.reduce((score, question, index) => {
            if (answers[index] === question.answer) {
                score += 1;
            }
            return score;
        }, 0);
    };

    return (
        <FullScreen handle={handle}>
            <div className={`quiz-container ${handle.active ? 'fullscreen-enter' : 'fullscreen-exit'}`}>
                <div className="background-tagline">Take the Quiz and Test Your Knowledge!</div>
                {!handle.active && !isQuizStarted && (
                    <button className="fullscreen-btn" onClick={startQuiz}>Go Fullscreen and Start Quiz</button>
                )}
                {isQuizFinished ? (
                    <div className="final-score">
                        <div>Your final score is: <span>{calculateScore()} / {questions.length}</span></div>
                        <div className="review-answers">
                            {questions.map((question, index) => (
                                <div key={index} className="review-question">
                                    <h3>{question.question}</h3>
                                    <p>Your answer: <span className={answers[index] === question.answer ? 'correct' : 'incorrect'}>{answers[index]}</span></p>
                                    {answers[index] !== question.answer && (
                                        <p>Correct answer: <span className="correct">{question.answer}</span></p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="timer">Time Remaining: {Math.floor(timer / 60)}:{timer % 60 < 10 ? '0' + timer % 60 : timer % 60}</div>
                        {questions.length > 0 && (
                            <div className="question">
                                <h2>{questions[currentQuestionIndex].question}</h2>
                                <div className="options">
                                    {questions[currentQuestionIndex].options.map((option, index) => (
                                        <button 
                                            key={index} 
                                            onClick={() => handleAnswer(option)} 
                                            disabled={!handle.active}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                                {!handle.active && <div className="fullscreen-warning">Please enter full screen mode to answer the questions.</div>}
                            </div>
                        )}
                    </>
                )}
            </div>
        </FullScreen>
    );
};

export default App;
