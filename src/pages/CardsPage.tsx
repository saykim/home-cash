import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCardForm } from '@/components/cards/CreditCardForm';
import { BenefitTierForm } from '@/components/cards/BenefitTierForm';
import { useCreditCards, useBenefitTiers } from '@/hooks/useCreditCards';
import { useAssets } from '@/hooks/useAssets';
import { formatCurrency } from '@/lib/formatters';
import { CreditCard, Trash2, Award } from 'lucide-react';

export default function CardsPage() {
  const { creditCards, addCreditCard, deleteCreditCard } = useCreditCards();
  const { allTiers, addBenefitTier, deleteBenefitTier } = useBenefitTiers();
  const { assets } = useAssets();

  const handleDeleteCard = async (id: string) => {
    if (confirm('이 카드를 삭제하시겠습니까? 관련된 혜택 정보도 모두 삭제됩니다.')) {
      await deleteCreditCard(id);
    }
  };

  const handleDeleteTier = async (id: string) => {
    if (confirm('이 혜택을 삭제하시겠습니까?')) {
      await deleteBenefitTier(id);
    }
  };

  const getAssetName = (assetId: string) => {
    return assets.find((a) => a.id === assetId)?.name || '알 수 없음';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">신용카드 관리</h1>
        <CreditCardForm addCreditCard={addCreditCard} />
      </div>

      {creditCards.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>등록된 카드가 없습니다</p>
            <p className="text-sm mt-2">카드를 추가하여 실적과 혜택을 관리하세요</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {creditCards.map((card) => {
            const cardTiers = allTiers
              .filter((t) => t.cardId === card.id)
              .sort((a, b) => a.threshold - b.threshold);

            return (
              <Card key={card.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{card.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        결제일: 매월 {card.billingDay}일 · 결제계좌: {getAssetName(card.linkedAssetId)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCard(card.id)}
                    className="hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">이용 기간</span>
                      <span>
                        {card.startOffset === -1 ? '전월' : '당월'} {card.startDay}일 ~{' '}
                        {card.endOffset === -1 ? '전월' : '당월'} {card.endDay}일
                      </span>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          혜택 등급
                        </h4>
                        <BenefitTierForm cardId={card.id} addBenefitTier={addBenefitTier} />
                      </div>

                      {cardTiers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">등록된 혜택이 없습니다</p>
                      ) : (
                        <div className="space-y-2">
                          {cardTiers.map((tier) => (
                            <div
                              key={tier.id}
                              className="flex items-center justify-between p-2 rounded bg-muted/50 group"
                            >
                              <div>
                                <p className="text-sm font-medium">{tier.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(tier.threshold)} 이상
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTier(tier.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
