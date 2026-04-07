"use client";

import { Button, Card, Input } from "@quiz/ui";
import { startTransition, useState } from "react";
import { apiRequest } from "../../lib/api";

type StudentField = {
  key: string;
  label: string;
  type: "TEXT" | "EMAIL" | "NUMBER" | "PHONE";
  required: boolean;
  sortOrder: number;
};

type QuizQuestion = {
  key: string;
  prompt: string;
  questionType: "SINGLE" | "MULTI";
  marks: number;
  negativeMarks: number;
  sortOrder: number;
  options: Array<{
    key: string;
    text: string;
    isCorrect: boolean;
    sortOrder: number;
  }>;
};

const selectClasses =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]";

const initialFields: StudentField[] = [
  { key: "name", label: "Name", type: "TEXT", required: true, sortOrder: 0 },
  { key: "roll_number", label: "Roll Number", type: "TEXT", required: true, sortOrder: 1 },
];

const initialQuestions: QuizQuestion[] = [
  {
    key: "q_1",
    prompt: "Which access pattern should protect faculty-only APIs?",
    questionType: "SINGLE",
    marks: 2,
    negativeMarks: 0.25,
    sortOrder: 0,
    options: [
      { key: "a", text: "JWT + role middleware", isCorrect: true, sortOrder: 0 },
      { key: "b", text: "Only client-side checks", isCorrect: false, sortOrder: 1 },
      { key: "c", text: "No auth in preview mode", isCorrect: false, sortOrder: 2 },
      { key: "d", text: "Shared anonymous token", isCorrect: false, sortOrder: 3 },
    ],
  },
];

export function QuizBuilder({
  initialVersionId,
  quizId,
}: {
  initialVersionId?: string;
  quizId: string;
}) {
  const [versionId, setVersionId] = useState(initialVersionId ?? "");
  const [title, setTitle] = useState("Secure Systems Quiz");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [deadline, setDeadline] = useState("");
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [accessMode, setAccessMode] = useState<"AUTHENTICATED_ONLY" | "GUEST_ALLOWED">(
    "AUTHENTICATED_ONLY",
  );
  const [resultVisibility, setResultVisibility] = useState<
    "IMMEDIATE" | "SCORE_ONLY" | "MANUAL_RELEASE"
  >("IMMEDIATE");
  const [studentFields, setStudentFields] = useState(initialFields);
  const [questions, setQuestions] = useState(initialQuestions);
  const [quizCode, setQuizCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function describeError(error: unknown) {
    if (typeof error === "object" && error && "message" in error) {
      return String(error.message);
    }

    return "We could not complete that action. Please try again.";
  }

  async function persistStudentSchema(currentVersionId: string) {
    return apiRequest<{ version: { id: string } }>(
      `/faculty/quizzes/versions/${currentVersionId}/student-schema`,
      {
        method: "PUT",
        body: JSON.stringify({ studentFields }),
      },
    );
  }

  async function persistConfiguration(currentVersionId: string) {
    return apiRequest<{ version: { id: string } }>(
      `/faculty/quizzes/versions/${currentVersionId}/configuration`,
      {
        method: "PUT",
        body: JSON.stringify({
          title,
          durationMinutes,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          attemptLimit,
          shuffleQuestions,
          accessMode,
          resultVisibility,
        }),
      },
    );
  }

  async function persistQuestions(currentVersionId: string) {
    return apiRequest<{ version: { id: string } }>(
      `/faculty/quizzes/versions/${currentVersionId}/questions`,
      {
        method: "PUT",
        body: JSON.stringify({ questions }),
      },
    );
  }

  async function saveStudentSchema() {
    if (!versionId) return;

    setErrorMessage(null);

    try {
      await persistStudentSchema(versionId);
      setStatusMessage("Student schema saved as draft.");
    } catch (error) {
      setErrorMessage(describeError(error));
    }
  }

  async function saveConfiguration() {
    if (!versionId) return;

    setErrorMessage(null);

    try {
      await persistConfiguration(versionId);
      setStatusMessage("Quiz configuration updated.");
    } catch (error) {
      setErrorMessage(describeError(error));
    }
  }

  async function saveQuestions() {
    if (!versionId) return;

    setErrorMessage(null);

    try {
      await persistQuestions(versionId);
      setStatusMessage("Questions saved to draft.");
    } catch (error) {
      setErrorMessage(describeError(error));
    }
  }

  async function publishQuiz() {
    if (!versionId) return;

    setErrorMessage(null);

    try {
      await persistStudentSchema(versionId);
      await persistConfiguration(versionId);
      await persistQuestions(versionId);

      const payload = await apiRequest<{ version: { quizCode: string } }>(
        `/faculty/quizzes/versions/${versionId}/publish`,
        {
          method: "POST",
          body: JSON.stringify({ confirmPublish: true }),
        },
      );

      setQuizCode(payload.version.quizCode);
      setStatusMessage("Quiz published and quiz code generated.");
    } catch (error) {
      setErrorMessage(describeError(error));
    }
  }

  function updateStudentField(index: number, next: Partial<StudentField>) {
    setStudentFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...next } : field,
      ),
    );
  }

  function addStudentField() {
    startTransition(() => {
      setStudentFields((current) => [
        ...current,
        {
          key: `field_${current.length + 1}`,
          label: `Field ${current.length + 1}`,
          type: "TEXT",
          required: false,
          sortOrder: current.length,
        },
      ]);
    });
  }

  function removeStudentField(index: number) {
    setStudentFields((current) =>
      current
        .filter((_, fieldIndex) => fieldIndex !== index)
        .map((field, fieldIndex) => ({ ...field, sortOrder: fieldIndex })),
    );
  }

  function updateQuestion(index: number, next: Partial<QuizQuestion>) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...next } : question,
      ),
    );
  }

  function updateOption(
    questionIndex: number,
    optionIndex: number,
    next: Partial<QuizQuestion["options"][number]>,
  ) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) {
          return question;
        }

        return {
          ...question,
          options: question.options.map((option, currentOptionIndex) =>
            currentOptionIndex === optionIndex ? { ...option, ...next } : option,
          ),
        };
      }),
    );
  }

  function toggleCorrectOption(questionIndex: number, optionIndex: number, checked: boolean) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) {
          return question;
        }

        return {
          ...question,
          options: question.options.map((option, currentOptionIndex) => {
            if (question.questionType === "SINGLE" && checked) {
              return { ...option, isCorrect: currentOptionIndex === optionIndex };
            }

            if (currentOptionIndex === optionIndex) {
              return { ...option, isCorrect: checked };
            }

            return option;
          }),
        };
      }),
    );
  }

  function addQuestion() {
    startTransition(() => {
      setQuestions((current) => [
        ...current,
        {
          key: `q_${current.length + 1}`,
          prompt: "New question prompt",
          questionType: "SINGLE",
          marks: 1,
          negativeMarks: 0,
          sortOrder: current.length,
          options: [
            { key: "a", text: "Option A", isCorrect: true, sortOrder: 0 },
            { key: "b", text: "Option B", isCorrect: false, sortOrder: 1 },
          ],
        },
      ]);
    });
  }

  function removeQuestion(index: number) {
    setQuestions((current) =>
      current
        .filter((_, questionIndex) => questionIndex !== index)
        .map((question, questionIndex) => ({ ...question, sortOrder: questionIndex })),
    );
  }

  function addOption(questionIndex: number) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) {
          return question;
        }

        const nextIndex = question.options.length;
        return {
          ...question,
          options: [
            ...question.options,
            {
              key: `option_${nextIndex + 1}`,
              text: `Option ${String.fromCharCode(65 + nextIndex)}`,
              isCorrect: false,
              sortOrder: nextIndex,
            },
          ],
        };
      }),
    );
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) {
          return question;
        }

        return {
          ...question,
          options: question.options
            .filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex)
            .map((option, currentOptionIndex) => ({ ...option, sortOrder: currentOptionIndex })),
        };
      }),
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="section-title">Draft controls</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Version workflow</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Save progress at any step, then publish the draft to generate an immutable quiz code.
            </p>
            <p className="mt-4 text-sm text-slate-600">
              Quiz lineage ID: <span className="font-medium text-slate-900">{quizId}</span>
            </p>
          </div>

          <div className="grid w-full gap-4 lg:max-w-xl">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Draft version ID</label>
              <Input
                value={versionId}
                onChange={(event) => setVersionId(event.target.value)}
                placeholder="Paste or keep the active draft version ID"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={saveQuestions}>
                Save as Draft
              </Button>
              <Button onClick={publishQuiz}>Submit Quiz</Button>
            </div>
          </div>
        </div>

        {quizCode ? (
          <div className="status-message mt-5">
            Published quiz code: <strong>{quizCode}</strong>
          </div>
        ) : null}

        {statusMessage ? <div className="status-message mt-4">{statusMessage}</div> : null}
        {errorMessage ? <div className="error-message mt-4">{errorMessage}</div> : null}

        {!versionId ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Create a draft first or paste an existing draft version ID to save builder changes.
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6">
        <Card>
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-title">Step 1</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Student data schema</h2>
              <p className="mt-2 text-sm text-slate-600">
                Define the student details that must be collected before a quiz can begin.
              </p>
            </div>
            <Button variant="secondary" onClick={addStudentField}>
              Add Field
            </Button>
          </div>

          <div className="mt-6 grid gap-4">
            {studentFields.map((field, index) => (
              <div
                key={field.key}
                className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.1fr_1fr_0.8fr_auto_auto]"
              >
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Label
                  </label>
                  <Input
                    value={field.label}
                    onChange={(event) => updateStudentField(index, { label: event.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Key
                  </label>
                  <Input
                    value={field.key}
                    onChange={(event) => updateStudentField(index, { key: event.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Type
                  </label>
                  <select
                    className={selectClasses}
                    value={field.type}
                    onChange={(event) =>
                      updateStudentField(index, {
                        type: event.target.value as StudentField["type"],
                      })
                    }
                  >
                    <option value="TEXT">Text</option>
                    <option value="EMAIL">Email</option>
                    <option value="NUMBER">Number</option>
                    <option value="PHONE">Phone</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) =>
                      updateStudentField(index, { required: event.target.checked })
                    }
                  />
                  Required
                </label>
                <Button
                  variant="ghost"
                  onClick={() => removeStudentField(index)}
                  disabled={studentFields.length <= 1}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={saveStudentSchema}>Save Step 1</Button>
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-200 pb-5">
            <p className="section-title">Step 2</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Quiz configuration</h2>
            <p className="mt-2 text-sm text-slate-600">
              Set the scheduling, attempt rules, access mode, and result visibility for this
              version.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Quiz title</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Duration (minutes)
              </label>
              <Input
                type="number"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(Number(event.target.value))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Attempt limit</label>
              <Input
                type="number"
                value={attemptLimit}
                onChange={(event) => setAttemptLimit(Number(event.target.value))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Deadline</label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Access mode</label>
              <select
                className={selectClasses}
                value={accessMode}
                onChange={(event) =>
                  setAccessMode(event.target.value as "AUTHENTICATED_ONLY" | "GUEST_ALLOWED")
                }
              >
                <option value="AUTHENTICATED_ONLY">Authenticated students only</option>
                <option value="GUEST_ALLOWED">Allow guest access</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Result visibility
              </label>
              <select
                className={selectClasses}
                value={resultVisibility}
                onChange={(event) =>
                  setResultVisibility(
                    event.target.value as "IMMEDIATE" | "SCORE_ONLY" | "MANUAL_RELEASE",
                  )
                }
              >
                <option value="IMMEDIATE">Immediate analysis</option>
                <option value="SCORE_ONLY">Score only</option>
                <option value="MANUAL_RELEASE">Manual release</option>
              </select>
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(event) => setShuffleQuestions(event.target.checked)}
              />
              Shuffle questions before presenting them to students
            </label>
          </div>

          <div className="mt-6">
            <Button onClick={saveConfiguration}>Save Step 2</Button>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-title">Step 3</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Question builder</h2>
              <p className="mt-2 text-sm text-slate-600">
                Add objective questions, define scoring, and mark correct options for grading.
              </p>
            </div>
            <Button variant="secondary" onClick={addQuestion}>
              Add Question
            </Button>
          </div>

          <div className="mt-6 grid gap-4">
            {questions.map((question, questionIndex) => (
              <div key={question.key} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Question prompt
                    </label>
                    <Input
                      value={question.prompt}
                      onChange={(event) =>
                        updateQuestion(questionIndex, { prompt: event.target.value })
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => removeQuestion(questionIndex)}
                    disabled={questions.length <= 1}
                  >
                    Remove
                  </Button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Type
                    </label>
                    <select
                      className={selectClasses}
                      value={question.questionType}
                      onChange={(event) =>
                        updateQuestion(questionIndex, {
                          questionType: event.target.value as QuizQuestion["questionType"],
                        })
                      }
                    >
                      <option value="SINGLE">Single correct</option>
                      <option value="MULTI">Multiple correct</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Marks
                    </label>
                    <Input
                      type="number"
                      value={question.marks}
                      onChange={(event) =>
                        updateQuestion(questionIndex, { marks: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Negative marks
                    </label>
                    <Input
                      type="number"
                      value={question.negativeMarks}
                      onChange={(event) =>
                        updateQuestion(questionIndex, {
                          negativeMarks: Number(event.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-slate-700">Options</p>
                    <Button variant="secondary" onClick={() => addOption(questionIndex)}>
                      Add Option
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={`${question.key}-${option.key}-${optionIndex}`}
                        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto_auto]"
                      >
                        <Input
                          value={option.text}
                          onChange={(event) =>
                            updateOption(questionIndex, optionIndex, {
                              text: event.target.value,
                            })
                          }
                        />
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={(event) =>
                              toggleCorrectOption(questionIndex, optionIndex, event.target.checked)
                            }
                          />
                          Correct
                        </label>
                        <Button
                          variant="ghost"
                          onClick={() => removeOption(questionIndex, optionIndex)}
                          disabled={question.options.length <= 2}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={saveQuestions}>Save Step 3</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
