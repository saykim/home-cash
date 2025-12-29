import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCardForm } from '@/components/cards/CreditCardForm';
import { BenefitTierForm } from '@/components/cards/BenefitTierForm';
import { useCreditCards, useBenefitTiers } from '@/hooks/useCreditCards';
import { useAssets } from '@/hooks/useAssets';
import { formatCurrency } from '@/lib/formatters';
import { CreditCard, Trash2, Award, Edit } from 'lucide-react';

export default function CardsPage() {
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard } = useCreditCards();
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
    <div className="space-y-3">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creditCards.map((card) => {
            const cardTiers = allTiers
              .filter((t) => t.cardId === card.id)
              .sort((a, b) => a.threshold - b.threshold);

            return (
              <Card key={card.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="text-base">{card.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <CreditCardForm
                        mode="edit"
                        card={card}
                        updateCreditCard={updateCreditCard}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="수정">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        onClick={() => handleDeleteCard(card.id)}
                        title="삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      결제일: 매월 {card.billingDay}일
                    </p>
                    <p className="text-xs text-muted-foreground">
                      계좌: {getAssetName(card.linkedAssetId)}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="pt-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">이용 기간</span>
                      <span className="text-right">
                        {card.startOffset === -1 ? '전월' : '당월'} {card.startDay}일 ~{' '}
                        {card.endOffset === -1 ? '전월' : '당월'} {card.endDay}일
                      </span>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold flex items-center gap-1">
                          <Award className="h-3.5 w-3.5" />
                          혜택 등급
                        </h4>
                        <BenefitTierForm cardId={card.id} addBenefitTier={addBenefitTier} />
                      </div>

                      {cardTiers.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">등록된 혜택이 없습니다</p>
                      ) : (
                        <div className="space-y-1.5">
                          {cardTiers.map((tier) => (
                            <div
                              key={tier.id}
                              className="flex items-center justify-between p-2 rounded bg-muted/50 hover:bg-muted/80 transition-colors group"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{tier.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(tier.threshold)} 이상
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                onClick={() => handleDeleteTier(tier.id)}
                                title="삭제"
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
