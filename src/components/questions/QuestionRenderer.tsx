import React from 'react'
import ShortTextQuestion from './respondent/ShortTextQuestion'
import LongTextQuestion from './respondent/LongTextQuestion'
import CheckBoxQuestion from './respondent/CheckBoxQuestion'
import DropdownQuestion from './respondent/DropdownQuestion'
import MultipleChoiceQuestion from './respondent/MultipleChoiceQuestion'
import LikertQuestion from './respondent/LikertQuestion'
import DualLikertQuestion from './respondent/DualLikertQuestion'
import TrueFalseQuestion from './respondent/TrueFalseQuestion'

interface QuestionData {
  id: string
  question_text: string
  question_type: string
  is_required?: boolean
  options?: any
  branching_logic?: any
}

interface QuestionRendererProps {
  question: QuestionData | null | undefined
  value: any
  onChange: (value: any) => void
  preview?: boolean
}

const questionMap: Record<string, React.ComponentType<any>> = {
  short_text: ShortTextQuestion,
  long_text: LongTextQuestion,
  checkbox: CheckBoxQuestion,
  dropdown: DropdownQuestion,
  multiple_choice: MultipleChoiceQuestion,
  likert: LikertQuestion,
  dual_likert: DualLikertQuestion,
  true_false: TrueFalseQuestion,
}

export default function QuestionRenderer({
  question,
  value,
  onChange,
  preview = false,
}: QuestionRendererProps) {
  if (!question) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-500">
        Question data not found.
      </div>
    )
  }

  const Component = questionMap[question.question_type]

  if (!Component) {
    return (
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-700">
        Unsupported question type:{' '}
        <span className="font-semibold">{question.question_type}</span>
      </div>
    )
  }

  return (
    <Component
      question={question}
      value={value}
      onChange={onChange}
      preview={preview}
    />
  )
}
