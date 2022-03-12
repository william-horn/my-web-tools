/*
? @document-start
====================
| QUIZ BUILDER API |
==================================================================================================================================

? @author:                 William J. Horn
? @document-name:          quizbuilder.js
? @document-created:       03/08/2022
? @document-modified:      03/09/2022
? @document-version:       v1.0.0

==================================================================================================================================

? @document-info
==================
| ABOUT DOCUMENT |
==================================================================================================================================

This file is a class module meant for creating an interface to interact with a "quiz-like" system.
- More coming soon

==================================================================================================================================

? @document-api
=============
| ABOUT API |
==================================================================================================================================

Coming soon

==================================================================================================================================

? @document-todo
=================
| DOCUMENT TODO |
==================================================================================================================================

-   

==================================================================================================================================
*/

import gutil from "./gutil.js.js";
import Event from "./event.js.js";

// short-hand for calling function if it exists
function doIfFunction(func, ...args) {
    if (func) func(...args);
}

export class QuizBuilder {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.duration = 0;
        this.timeLeft = 0;
        this.correctAnswers = 0;
        this.finishState = "incomplete";
        // this.timerRoutine = thread

        // events
        this.onQuizFinish = new Event();
    }

    addQuestion(question) {
        this.questions.push(question);
    }

    randomizeQuestions() {
        return gutil.randomizeArray(this.questions);
    }

    getIncorrectAnswers() {
        return this.questions.length - this.correctAnswers;
    }

    getCorrectAnswers() {
        return this.correctAnswers;
    }

    getScore() {
        let correct = this.correctAnswers;
        let total = this.questions.length;
        return /[^\.]+.?.?/.exec((correct/total*100).toString()) + "%";
    }

    getNextQuestion() {
        // if there is no next question, then finish the quiz
        if (this.currentQuestionIndex >= this.questions.length) {
            this.finishState = "complete";
            this.reset();
            return null;
        }

        let nextQuestion = this.questions[this.currentQuestionIndex];
        this.currentQuestionIndex++;

        nextQuestion.onAnswerStateChanged.connect((state) => {
            if (state === "correct") this.correctAnswers++;
            nextQuestion.onAnswerStateChanged.disconnectAll();
        });

        return nextQuestion;
    }

    setDuration(time) {
        this.duration = time;
        this.timeLeft = time;
    }

    setTimeLeft(amount) {
        if (!this.timerRoutine) return;
        this.timeLeft = Math.min(this.duration, Math.max(0, amount));
        if (this.timeLeft === 0) this.reset();
    }

    subtractTime(amount) {
        this.setTimeLeft(this.timeLeft - amount);
    }

    addTime(amount) {
        this.setTimeLeft(this.timeLeft + amount);
    }

    startTimer(callback) {
        if (this.timerRoutine) return;
        this.timeLeft = this.duration;

        doIfFunction(callback, this.getTimeLeft()); // callback for initial time (duration)
        this.timerRoutine = setInterval(() => {
            this.subtractTime(1);
            doIfFunction(callback, this.getTimeLeft()); // callback for all time after
        }, 1000);
    }

    getTimeLeft() {
        // clamp timeLeft in case it was altered externally
        return Math.min(this.duration, Math.max(0, this.timeLeft));
    }

    reset() {
        // fire onQuizFinish event 
        this.onQuizFinish.fire(this.finishState);

        if (this.timerRoutine) {
            clearInterval(this.timerRoutine);
            this.timerRoutine = null;
        }

        this.currentQuestionIndex = 0;
    }
}

export class Question {
    constructor(questionTitle) {
        this.title = questionTitle;
        this.choices = [];
        this.rightAnswer = "";
        this.answerState = "incorrect" // "incorrect" | "correct"
        this.onAnswerStateChanged = new Event();
    }

    setChoices(...args) {
        this.choices = [...args];
        return this;
    }

    getRandomChoices() {
        let choices = this.getChoices();
        return gutil.randomizeArray(choices);
    }

    getChoices() {
        let choices = gutil.weakCloneArray(this.choices);
        choices.push(this.rightAnswer);
        return choices;
    }

    setRightAnswer(answer) {
        this.rightAnswer = answer;
        return this;
    }

    answer(input) {
        this.answerState = input === this.rightAnswer ? "correct" : "incorrect";
        this.onAnswerStateChanged.fire(this.answerState);
    }
}

