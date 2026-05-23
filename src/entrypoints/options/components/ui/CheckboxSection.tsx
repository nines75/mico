import type { CheckboxProps } from "./Checkbox";
import Checkboxes from "./Checkbox";
import H2 from "./H2";

export type CheckboxGroups = CheckboxSectionProps["groups"];

export interface CheckboxSectionProps {
  groups: {
    heading?: string;
    hasChildren?: boolean;
    items: CheckboxProps[];
  }[];
  children?: React.ReactNode;
}

export default function CheckboxSection({
  groups,
  children,
}: CheckboxSectionProps) {
  return groups.map(({ heading, hasChildren, items }) => (
    <H2 name={heading} key={items[0]?.id}>
      <Checkboxes items={items} />
      {hasChildren === true && children}
    </H2>
  ));
}
