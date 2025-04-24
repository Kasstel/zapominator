import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fileContent, setFileContent] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizData, setQuizData] = useState([]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      setFileContent(e.target.result);
    };

    if (file) {
      reader.readAsText(file);
    }
  };

  const handleStartQuiz = async () => {
    try {
      const file = document.querySelector('input[type="file"]').files[0];
      const formData = new FormData();
      formData.append('value', file); // 👈 имя ключа value, как требует сервер

      await axios.post('http://127.0.0.1:8000/files/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setQuizStarted(true);
    } catch (error) {
      console.error('Ошибка при отправке файла:', error);
    }
  };



  useEffect(() => {
    if (quizStarted) {
      axios.get('http://127.0.0.1:8000/cards/')
        .then((response) => {
          const serverData = response.data.map((card) => ({
            text: card.question,
            options: [
              { text: card.right_answer, isCorrect: true },
              { text: card.answer1, isCorrect: false },
              { text: card.answer2, isCorrect: false },
              { text: card.answer3, isCorrect: false },
            ].sort(() => Math.random() - 0.5),
            selectedAnswer: null,
            isAnswered: false,
            isCorrect: false,
          }));
          setQuizData(serverData);

          return axios.post('http://127.0.0.1:8000/cards/clear/');
        })
        .then(() => {
          console.log('Карточки успешно удалены после загрузки');
        })
        .catch((error) => {
          console.error('Ошибка при получении или удалении карточек:', error);
        });
    }
  }, [quizStarted]);

  const handleAnswerSelect = (questionIndex, option) => {
    const updatedQuiz = [...quizData];
    updatedQuiz[questionIndex].selectedAnswer = option;
    updatedQuiz[questionIndex].isAnswered = true;
    updatedQuiz[questionIndex].isCorrect = option.isCorrect;

    if (!option.isCorrect) {
      const [incorrectQuestion] = updatedQuiz.splice(questionIndex, 1);
      updatedQuiz.push(incorrectQuestion);
    }

    setQuizData(updatedQuiz);
  };

  const handleNextQuestion = () => {
    if (quizData[currentQuestionIndex].isCorrect) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      setQuizData((prevData) =>
        prevData.map((q, idx) =>
          idx === currentQuestionIndex
            ? { ...q, isAnswered: false, selectedAnswer: null }
            : q
        )
      );
    }
  };

  const renderQuestion = (question, index) => {
    return (
      <div className="card" key={index}>
        <h3>{question.text}</h3>
        <div className="options">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              className={`option ${
                question.selectedAnswer === option
                  ? option.isCorrect
                    ? 'correct'
                    : 'incorrect'
                  : ''
              }`}
              onClick={() => handleAnswerSelect(index, option)}
              disabled={question.isAnswered}
            >
              {option.text}
            </button>
          ))}
        </div>
        {question.isAnswered && (
          <div className="feedback">
            <p className={question.isCorrect ? 'correct-feedback' : 'incorrect-feedback'}>
              {question.isCorrect ? 'Правильный ответ!' : 'Неправильный ответ!'}
            </p>
            <button className="next-btn" onClick={handleNextQuestion}>
              Далее
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="quiz-container">
      {!quizStarted ? (
        <div className="start-screen">
          <input
            type="file"
            onChange={handleFileChange}
            className="input-file"
          />
          {fileContent && (
            <button className="start-btn" onClick={handleStartQuiz}>
              Создать тест
            </button>
          )}
        </div>
      ) : currentQuestionIndex < quizData.length ? (
        renderQuestion(quizData[currentQuestionIndex], currentQuestionIndex)
      ) : (
        <div className="result">Тест завершен!</div>
      )}
    </div>
  );
};

export default App;
