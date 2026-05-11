import ShortTextQuestion from "./ShortTextQuestion";
import LongTextQuestion from "./LongTextQuestion";
import CheckBoxQuestion from "./CheckBoxQuestion";
import DropdownQuestion from "./DropdownQuestion";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import LikertQuestion from "./LikertQuestion";
import DualLikertQuestion from "./DualLikertQuestion";
import TrueFalseQuestion from "./TrueFalseQuestion";

/*
|--------------------------------------------------------------------------
| Question Component Map
|--------------------------------------------------------------------------
| Mapping antara type question dari database/schema
| dengan component React yang akan dirender
|--------------------------------------------------------------------------
*/

const questionMap = {
  short_text: ShortTextQuestion,
  long_text: LongTextQuestion,
  checkbox: CheckBoxQuestion,
  dropdown: DropdownQuestion,
  multiple_choice: MultipleChoiceQuestion,
  likert: LikertQuestion,
  dual_likert: DualLikertQuestion,
  true_false: TrueFalseQuestion,
};

/*
|--------------------------------------------------------------------------
| Question Renderer Component
|--------------------------------------------------------------------------
| Component utama untuk merender question secara dinamis
|--------------------------------------------------------------------------
*/

export default function QuestionRenderer({
  question,
  value,
  onChange,
  preview = false,
}) {
  // validasi jika question data tidak ditemukan
  if (!question) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-500">
        Question data not found.
      </div>
    );
  }

// ambil component berdasarkan question.type
  const Component = questionMap[question.type];

// Validasi jika type tidak ditemukan
  if (!Component) {
    return (
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-700">
        Unsupported question type:{" "}
        <span className="font-semibold">{question.type}</span>
      </div>
    );
  }

// render component yang sesuai dengan props yang diberikan
  return (
    <Component
      question={question}
      value={value}
      onChange={onChange}
      preview={preview}
    />
  );
}