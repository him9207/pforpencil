# Funlearn Question Bank Update

Development-mode Question Bank refactor only.

## Included changes
- New `src/components/admin/MasterQuestionBank.tsx`
- Admin Master Question Bank now uses Grade -> Subject -> Category -> Skill -> Questions navigation.
- Category and Skill master records are stored in browser localStorage under `funlearn_master_question_bank_v1` for development testing.
- Existing questions are reconciled into the master hierarchy automatically.
- Category and Skill creation is available from the Question Bank.
- Question Type Master is displayed separately from curriculum skills.
- Existing Question Creator modal is reused, with Grade/Subject/Category/Skill preselected from the master hierarchy.
- Question IDs now follow `SUBJECT-GRADE-000001`, e.g. `M-G5-000001`.
- Fixed the Question Creator hook ordering so the modal can safely open/close.
- No production authentication, PIN security, RLS, payment, or final Supabase architecture was changed.

## Important development note
Master Category/Skill data is currently localStorage-backed because this phase intentionally does not change the production backend. This should be migrated to Supabase after the Question Bank structure and UX are approved.

## v2 fixes
- Existing legacy questions with missing `type` now display a meaningful Question Type by using the stored legacy type when present and safely inferring from existing question fields when type is absent.
- Question Type search now uses the normalized display label.
- Master Question Bank now detects newly active Grades/Subjects from the live Admin master lists and creates the corresponding development master scope automatically without overwriting existing categories/skills/questions.
- Newly created non-Maths subjects start with no categories so Admin can define their curriculum structure explicitly.
