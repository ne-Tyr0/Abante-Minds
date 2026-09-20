declare namespace AbanteMinds {
  interface ButtonProps {
    label: string;
    /** "inverse" is for saturated celebration grounds only, where the amber face disappears. */
    variant?: "primary" | "ghost" | "inverse";
    onClick?: (event: MouseEvent) => void;
    disabled?: boolean;
  }
  function Button(props: ButtonProps): HTMLButtonElement;

  interface SkillCardProps {
    label: string;
    icon?: string;
    colorKey?: 1 | 2 | 3 | 4;
    progress?: number; // 0-1
    onClick?: (event: MouseEvent) => void;
  }
  function SkillCard(props: SkillCardProps): HTMLButtonElement;

  interface PracticeHeaderProps {
    tier: string;
    questionIndex: number;
    questionTotal: number;
  }
  function PracticeHeader(props: PracticeHeaderProps): HTMLDivElement;

  interface CelebrationBannerProps {
    headline: string;
    sublabel?: string;
    icon?: string;
    /** Renders an inverse-variant Button inside the field. Omit for a banner that dismisses itself. */
    actionLabel?: string;
    onAction?: (event: MouseEvent) => void;
  }
  function CelebrationBanner(props: CelebrationBannerProps): HTMLDivElement;

  interface ProfileCardProps {
    name: string;
    school?: string;
    initial?: string;
    colorKey?: 1 | 2 | 3 | 4;
  }
  function ProfileCard(props: ProfileCardProps): HTMLDivElement;
}
