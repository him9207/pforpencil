import React from 'react';
import { Question } from '../../../types';
import MasterQuestionCreator, { MasterQuestionCreatorProps } from './MasterQuestionCreator';
import { CategoryMasterRecord, SkillMasterRecord } from '../../../data/questionBankMasterData';

export interface QuestionEditModalProps extends MasterQuestionCreatorProps {}

export default function QuestionEditModal(props: QuestionEditModalProps) {
  return <MasterQuestionCreator {...props} />;
}
