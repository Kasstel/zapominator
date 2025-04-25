import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizData, setQuizData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedFiles, setSavedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    const storedFiles = JSON.parse(localStorage.getItem('quizFiles')) || [];
    setSavedFiles(storedFiles);
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileName(file.name);
  };

  const handleUploadFile = async () => {
    setIsLoading(true);
    try {
      const file = document.querySelector('input[type="file"]').files[0];
      const formData = new FormData();
      formData.append('value', file);

      await axios.post('http://127.0.0.1:8000/files/', formData);
      const response = await axios.get('http://127.0.0.1:8000/cards/');
      await axios.post('http://127.0.0.1:8000/cards/clear/');

      const newFile = {
        name: file.name,
        questions: response.data.map(q => ({
          ...q,
          progress: { correctCount: 0, lastAnswered: null },
          status: null,
          marked: false
        })),
      };

      const updatedFiles = [...savedFiles, newFile];
      localStorage.setItem('quizFiles', JSON.stringify(updatedFiles));
      setSavedFiles(updatedFiles);
      setSelectedFile(newFile);
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = (file) => {
    const sortedQuestions = [...file.questions].sort((a, b) =>
        a.marked === b.marked ? 0 : a.marked ? -1 : 1
    );

    setQuizData(sortedQuestions.map(q => ({
      ...q,
      options: [
        { text: q.right_answer, isCorrect: true },
        { text: q.answer1, isCorrect: false },
        { text: q.answer2, isCorrect: false },
        { text: q.answer3, isCorrect: false },
      ].sort(() => Math.random() - 0.5),
      selectedAnswer: null,
      isAnswered: false,
    })));

    setQuizStarted(true);
    setCurrentQuestionIndex(0);
  };

  const handleAnswerSelect = (questionIndex, option) => {
    const updatedQuiz = [...quizData];
    const question = updatedQuiz[questionIndex];

    question.selectedAnswer = option;
    question.isAnswered = true;
    question.isCorrect = option.isCorrect;

    setQuizData(updatedQuiz);

    if (option.isCorrect) {
      setTimeout(() => setCurrentQuestionIndex(prev => prev + 1), 1000);
    }
  };

  const toggleMark = (questionIndex) => {
    const updatedFiles = savedFiles.map(file =>
        file.name === selectedFile.name ? {
          ...file,
          questions: file.questions.map((q, idx) =>
              idx === questionIndex ? { ...q, marked: !q.marked } : q
          )
        } : file
    );

    localStorage.setItem('quizFiles', JSON.stringify(updatedFiles));
    setSavedFiles(updatedFiles);

    const updatedQuiz = [...quizData];
    updatedQuiz[questionIndex].marked = !updatedQuiz[questionIndex].marked;
    setQuizData(updatedQuiz);
  };

  const handleExitQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setSelectedFile(null);
  };

  return (
      <div className="quiz-container">
        {!quizStarted ? (
            <div className="start-screen">
              {selectedFile ? (
                  <div className="file-details">
                    <button className="start-btn" onClick={() => setSelectedFile(null)}>
                      ← Назад
                    </button>
                    <h2>{selectedFile.name}</h2>

                    <div className="questions-list">
                      {selectedFile.questions
                          .filter(q => q.status || q.marked)
                          .map((q, idx) => (
                              <div key={idx} className="question-item">
                                <div className="question-header">
                                  {q.status === 'learned' && <span className="status learned">✅ Запомнил</span>}
                                  {q.status === 'needsReview' && <span className="status needs-review">🔄 Повторить</span>}
                                  {q.marked && <span className="status marked">⭐ Отмечен</span>}
                                  <p>{q.question}</p>
                                </div>
                              </div>
                          ))}
                    </div>

                    <button className="start-btn" onClick={() => startQuiz(selectedFile)}>
                      Начать тест
                    </button>
                  </div>
              ) : (
                  <>
                    {savedFiles.map(file => (
                        <div
                            key={file.name}
                            className="file-item"
                            onClick={() => setSelectedFile(file)}
                        >
                          {file.name}
                        </div>
                    ))}

                    <label className="file-upload">
                      <input type="file" onChange={handleFileChange} />
                      {fileName || 'Выберите файл'}
                      {isLoading && <div className="spinner" />}
                    </label>
                    {fileName && !isLoading && (
                        <button className="upload-btn" onClick={handleUploadFile}>
                          Загрузить файл
                        </button>
                    )}
                  </>
              )}
            </div>
        ) : isLoading ? (
            <div className="loader">
              <div className="spinner" />
            </div>
        ) : currentQuestionIndex < quizData.length ? (
            <div className="card">
              <h3>{quizData[currentQuestionIndex].question}</h3>

              <div className="options">
                {quizData[currentQuestionIndex].options.map((option, idx) => (
                    <button
                        key={idx}
                        className={`option ${
                            quizData[currentQuestionIndex].selectedAnswer === option
                                ? option.isCorrect ? 'correct' : 'incorrect'
                                : ''
                        }`}
                        onClick={() => handleAnswerSelect(currentQuestionIndex, option)}
                        disabled={quizData[currentQuestionIndex].isAnswered}
                    >
                      {option.text}
                    </button>
                ))}
              </div>

              {quizData[currentQuestionIndex].isAnswered && (
                  <div className="feedback-actions">
                    <p className={quizData[currentQuestionIndex].isCorrect ? 'correct' : 'incorrect'}>
                      {quizData[currentQuestionIndex].isCorrect ? 'Правильно!' : 'Неправильно!'}
                    </p>
                    <div className="mark-container">
                      <button
                          className={`mark-btn ${quizData[currentQuestionIndex].marked ? 'marked' : ''}`}
                          onClick={() => toggleMark(currentQuestionIndex)}
                      >
                        {quizData[currentQuestionIndex].marked ? '★ Отмечен' : '☆ Отметить вопрос'}
                      </button>
                      <button
                          className="next-btn"
                          onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                      >
                        Следующий вопрос →
                      </button>
                    </div>
                  </div>
              )}
            </div>
        ) : (
            <div className="result">
              <h2>Тест завершен!</h2>
              <button className="exit-btn" onClick={handleExitQuiz}>
                На главную
              </button>
            </div>
        )}

        {quizStarted && (
            <button className="exit-btn" onClick={handleExitQuiz}>
              Выйти
            </button>
        )}
      </div>
  );
};

export default App;