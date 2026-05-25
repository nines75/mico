import type { CheckboxProps } from "./Checkbox";
import Checkbox from "./Checkbox";
import H2 from "./H2";
import type { InputProps } from "./Input";
import Input from "./Input";

export type SectionsItem = SectionsProps["sections"];

export interface SectionsProps {
  sections: {
    heading?: string;
    items: (CheckboxProps | InputProps)[];
  }[];
}

export default function Sections({ sections }: SectionsProps) {
  return sections.map(({ heading, items }) => (
    <H2 name={heading} key={items[0]?.id}>
      {items.map((item) => {
        switch (item.type) {
          case "checkbox": {
            return <Checkbox key={item.id} {...item} />;
          }
          case "input": {
            return <Input key={item.id} {...item} />;
          }
        }
      })}
    </H2>
  ));
}
