import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fileContent, setFileContent] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  //const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(false);

  
  const [quizData, setQuizData] = useState([
    {
      text: "Что такое хранилище в контексте веб-приложений?",
      options: [
        { text: "Место для обработки данных", isCorrect: false },
        { text: "Место для хранения данных", isCorrect: true },
        { text: "Место для шифрования данных", isCorrect: false },
      ],
      selectedAnswer: null,
      isAnswered: false,
      isCorrect: false
    },
    {
      text: "Какие данные можно хранить в файле?",
      options: [
        { text: "Только текстовую информацию", isCorrect: false },
        { text: "Любые данные: текст, изображения, видео, и т.д.", isCorrect: true }
      ],
      selectedAnswer: null,
      isAnswered: false,
      isCorrect: false
    },
    {
      text: "Какой формат файла используется для хранения изображений?",
      options: [
        { text: ".txt", isCorrect: false },
        { text: ".jpg", isCorrect: true }
      ],
      selectedAnswer: null,
      isAnswered: false,
      isCorrect: false
    },
    {
      text: "Как можно обработать файл в браузере?",
      options: [
        { text: "Только с помощью серверной обработки", isCorrect: false },
        { text: "С помощью FileReader API", isCorrect: true }
      ],
      selectedAnswer: null,
      isAnswered: false,
      isCorrect: false
    },
    {
      text: "Что такое CORS (Cross-Origin Resource Sharing)?",
      options: [
        { text: "Механизм защиты от злоумышленников, который ограничивает доступ к ресурсам", isCorrect: true },
        { text: "Механизм, позволяющий загружать файлы с удаленных серверов", isCorrect: false }
      ],
      selectedAnswer: null,
      isAnswered: false,
      isCorrect: false
    }
  ]);




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
    setQuizStarted(true);
    /*
    try {
      const file = document.querySelector('input[type="file"]').files[0];
      const formData = new FormData();
      formData.append('value', file); // 👈 имя ключа value, как требует сервер

      setLoading(true); // Начинаем показывать лоадер

      await axios.post('http://127.0.0.1:8000/files/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setQuizStarted(true);
    } catch (error) {
      console.error('Ошибка при отправке файла:', error);
    }
      */
  };

  const handleExitQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setQuizData([]);
    setFileContent('');
  };

  useEffect(() => {
    if (quizStarted) {
      setLoading(true); // Показываем лоадер перед загрузкой данных

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
            <button className="start-btn" onClick={handleStartQuiz}>
              Создать тест
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
