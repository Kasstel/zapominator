import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fileContent, setFileContent] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);  // Добавляем состояние для отслеживания загрузки

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
    setIsLoading(true);  // Начинаем загрузку
    setLoading(true);
    try {
      const file = document.querySelector('input[type="file"]').files[0];
      const formData = new FormData();
      formData.append('value', file);

      await axios.post('http://127.0.0.1:8000/files/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setQuizStarted(true);
    } catch (error) {
      console.error('Ошибка при отправке файла:', error);
    } finally {
      setIsLoading(false);  // Останавливаем загрузку после завершения
      setLoading(false);
    }
  };

  const handleExitQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setQuizData([]);
    setFileContent('');
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

            setLoading(false); // Скрываем лоадер после получения данных
          })
          .catch((error) => {
            console.error('Ошибка при получении карточек:', error);
            setLoading(false); // Скрываем лоадер в случае ошибки
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
                  <button className="start-btn" onClick={handleStartQuiz} disabled={isLoading}>
                    {isLoading ? (
                        <div className="spinner"></div>  // Добавляем спиннер
                    ) : (
                        'Создать тест'
                    )}
                  </button>
              )}
            </div>
        ) : loading ? (
            <div className="loader"></div>
        ) : currentQuestionIndex < quizData.length ? (
            renderQuestion(quizData[currentQuestionIndex], currentQuestionIndex)
        ) : (
            <div className="result">Тест завершен!</div>
        )}
        {quizStarted && (
            <button className="exit-btn" onClick={handleExitQuiz}>
              Выйти на начальный экран
            </button>
        )}
      </div>
  );
};

export default App;
