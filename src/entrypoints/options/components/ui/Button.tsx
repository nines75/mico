export type ButtonItem = ButtonProps & { id: string; type: "button" };

export interface ButtonProps {
  label: string;
  children?: React.ReactNode;
  onClick: () => void;
}

export default function Button({ label, children, onClick }: ButtonProps) {
  return (
    <button type="button" className="button" onClick={onClick}>
      {children}
      {label}
    </button>
  );
}
