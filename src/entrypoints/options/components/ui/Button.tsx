export type ButtonItem = ButtonProps & { id: string; type: "button" };

export interface ButtonProps {
  label: string;
  onClick: () => void;
}

export default function Button({ label, onClick }: ButtonProps) {
  return (
    <button type="button" className="button" onClick={onClick}>
      {label}
    </button>
  );
}
