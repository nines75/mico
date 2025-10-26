import Checkbox, { CheckboxProps } from "./Checkbox.js";
import H2 from "./H2.js";

export type CheckboxGroups = {
    header?: string;
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
    return groups.map(({ header, isChildren, items }) => (
        <H2 name={header} key={header}>
            {items.map((props) => (
                <Checkbox key={props.id} {...props} />
            ))}
            {isChildren === true && children}
        </H2>
    ));
}
