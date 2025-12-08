import { useState } from 'preact/hooks';
import { useTokens } from '../../context/TokenProvider';
import { Button } from '../common/Button/Button';
import { Input } from '../common/Input/Input';
import { Card, CardHeader, CardBody, CardFooter } from '../common/Card/Card';
import './DesignSystemDemo.scss';

export function DesignSystemDemo() {
    const { theme, toggleTheme, contrast, toggleContrast } = useTokens();
    const [inputValue, setInputValue] = useState('');

    return (
        <div className="design-system-demo">
            <header className="design-system-demo__header">
                <div className="design-system-demo__header-content">
                    <h1 className="design-system-demo__title">KRDS Design System Demo</h1>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button onClick={toggleTheme} variant="secondary">
                            {theme === 'light' ? '🌙 다크 모드' : '☀️ 라이트 모드'}
                        </Button>
                        <Button onClick={toggleContrast} variant="secondary">
                            {contrast === 'standard' ? '👁️ 선명 모드' : '👁️ 기본 모드'}
                        </Button>
                    </div>
                </div>
                <p className="design-system-demo__description">범정부 UI/UX 가이드라인(KRDS)을 기반으로 한 디자인 시스템입니다.</p>
            </header>

            {/* ... rest of the file ... */}

            <div className="design-system-demo__grid">
                {/* Colors Section */}
                <section className="design-system-demo__section">
                    <h2 className="design-system-demo__section-title">Colors</h2>
                    <div className="design-system-demo__color-grid">
                        <div className="design-system-demo__color-item" style={{ background: 'var(--primitive-primary-50)' }}>
                            <span>Primary</span>
                        </div>
                        <div className="design-system-demo__color-item" style={{ background: 'var(--primitive-secondary-50)' }}>
                            <span>Secondary</span>
                        </div>
                        <div className="design-system-demo__color-item" style={{ background: 'var(--primitive-success-50)' }}>
                            <span>Success</span>
                        </div>
                        <div className="design-system-demo__color-item" style={{ background: 'var(--primitive-warning-50)' }}>
                            <span>Warning</span>
                        </div>
                        <div className="design-system-demo__color-item" style={{ background: 'var(--primitive-error-50)' }}>
                            <span>Error</span>
                        </div>
                    </div>
                </section>

                {/* Typography Section */}
                <section className="design-system-demo__section">
                    <h2 className="design-system-demo__section-title">Typography</h2>
                    <div className="design-system-demo__typography-list">
                        <h1 style={{ fontSize: 'var(--typo-display-large-size-pc)' }}>Display Large</h1>
                        <h2 style={{ fontSize: 'var(--typo-heading-1-size-pc)' }}>Heading 1</h2>
                        <h3 style={{ fontSize: 'var(--typo-heading-2-size-pc)' }}>Heading 2</h3>
                        <p style={{ fontSize: 'var(--typo-body-large-size)' }}>Body Large - 본문 텍스트입니다.</p>
                        <p style={{ fontSize: 'var(--typo-body-medium-size)' }}>Body Medium - 본문 텍스트입니다.</p>
                        <p style={{ fontSize: 'var(--typo-body-small-size)' }}>Body Small - 본문 텍스트입니다.</p>
                    </div>
                </section>

                {/* Components Section */}
                <section className="design-system-demo__section">
                    <h2 className="design-system-demo__section-title">Buttons</h2>
                    <div className="design-system-demo__component-row">
                        <Button variant="primary">Primary Button</Button>
                        <Button variant="secondary">Secondary Button</Button>
                        <Button variant="primary" disabled>
                            Disabled
                        </Button>
                    </div>
                    <div className="design-system-demo__component-row">
                        <Button size="lg">Large</Button>
                        <Button size="md">Medium</Button>
                        <Button size="sm">Small</Button>
                    </div>
                </section>

                <section className="design-system-demo__section">
                    <h2 className="design-system-demo__section-title">Inputs</h2>
                    <div className="design-system-demo__component-col">
                        <Input label="기본 입력" placeholder="텍스트를 입력하세요" value={inputValue} onInput={(e) => setInputValue(e.currentTarget.value)} />
                        <Input label="도움말 텍스트" placeholder="입력해주세요" helperText="이것은 도움말 텍스트입니다." />
                        <Input label="에러 상태" placeholder="Error" error helperText="필수 입력 항목입니다." />
                        <Input label="비활성화" placeholder="Disabled input" disabled />
                    </div>
                </section>

                <section className="design-system-demo__section">
                    <h2 className="design-system-demo__section-title">Cards</h2>
                    <div className="design-system-demo__card-grid">
                        <Card>
                            <CardHeader>
                                <h3>기본 카드</h3>
                            </CardHeader>
                            <CardBody>
                                <p>카드의 본문 내용입니다. 다양한 콘텐츠를 담을 수 있습니다.</p>
                            </CardBody>
                            <CardFooter>
                                <Button size="sm">Action</Button>
                            </CardFooter>
                        </Card>

                        <Card interactive>
                            <CardHeader>
                                <h3>인터랙티브 카드</h3>
                            </CardHeader>
                            <CardBody>
                                <p>이 카드는 호버 효과가 적용되어 클릭 가능한 느낌을 줍니다.</p>
                            </CardBody>
                        </Card>
                    </div>
                </section>
            </div>
        </div>
    );
}
