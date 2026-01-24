import type { CheckboxProps } from "./Checkbox";
import Checkbox from "./Checkbox";
import H2 from "./H2";

export type CheckboxGroups = {
    heading?: string;
    isChildren?: boolean;
    items: CheckboxProps[];
}[];

export interface CheckboxSectionProps {
    groups: CheckboxGroups;
    children?: React.ReactNode;
}

export default function CheckboxSection({
    groups,
    children,
}: CheckboxSectionProps) {
    return groups.map(({ heading, isChildren, items }) => (
        <H2 name={heading} key={items[0]?.id}>
            {items.map((props) => (
                <Checkbox key={props.id} {...props} />
            ))}
            {isChildren === true && children}
        </H2>
    ));
}
