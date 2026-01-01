import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/dashboard_models.dart';
import '../../providers/auth_provider.dart';
import '../../services/dashboard_service.dart';

/// Écran Dashboard principal
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _selectedPeriod = 'today';
  DashboardStats? _stats;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await dashboardService.getStats(period: _selectedPeriod);

    setState(() {
      _isLoading = false;
      if (result.success && result.stats != null) {
        _stats = result.stats;
      } else {
        _error = result.error;
      }
    });
  }

  void _changePeriod(String period) {
    if (period != _selectedPeriod) {
      setState(() => _selectedPeriod = period);
      _loadStats();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppTheme.backgroundDark,
        elevation: 0,
        title: Text(
          'Tableau de Bord',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _loadStats,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadStats,
        color: AppTheme.primaryBlue,
        child: _buildBody(user),
      ),
    );
  }

  Widget _buildBody(dynamic user) {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: AppTheme.primaryBlue),
            SizedBox(height: 16),
            Text('Chargement du tableau de bord...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: AppTheme.error),
              const SizedBox(height: 16),
              Text(
                'Erreur',
                style: GoogleFonts.inter(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.error,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _loadStats,
                icon: const Icon(Icons.refresh),
                label: const Text('Réessayer'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryBlue,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header avec filtres
          _buildHeader(user),
          const SizedBox(height: 20),

          // Statistiques principales
          _buildMainStats(),
          const SizedBox(height: 24),

          // Services populaires et Activité récente
          _buildServicesPopulaires(),
          const SizedBox(height: 20),

          _buildActiviteRecente(),
          const SizedBox(height: 24),

          // Résumé financier
          _buildResumeFinancier(),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildHeader(dynamic user) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Tableau de Bord',
                    style: GoogleFonts.inter(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Bonjour, ${user?.displayName ?? 'Utilisateur'} !',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        // Filtres de période
        _buildPeriodFilters(),
      ],
    );
  }

  Widget _buildPeriodFilters() {
    return Row(
      children: [
        _buildPeriodChip('today', "Aujourd'hui"),
        const SizedBox(width: 8),
        _buildPeriodChip('week', 'Semaine'),
        const SizedBox(width: 8),
        _buildPeriodChip('month', 'Mois'),
      ],
    );
  }

  Widget _buildPeriodChip(String period, String label) {
    final isSelected = _selectedPeriod == period;
    return GestureDetector(
      onTap: () => _changePeriod(period),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryBlue : Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppTheme.primaryBlue.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : AppTheme.cardShadow,
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildMainStats() {
    if (_stats == null) return const SizedBox.shrink();

    final stats = _stats!.statistiquesPrincipales;

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _StatCard(
                title: 'Recettes',
                value: _formatCurrency(stats.recettesJour.valeur),
                change: stats.recettesJour.variation,
                icon: Icons.trending_up_rounded,
                color: AppTheme.success,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StatCard(
                title: 'Sessions Internet',
                value: stats.sessionsInternet.valeur.toInt().toString(),
                icon: Icons.wifi_rounded,
                color: AppTheme.primaryBlue,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _StatCard(
                title: 'Documents',
                value: stats.documentsImprimes.valeur.toInt().toString(),
                icon: Icons.print_rounded,
                color: const Color(0xFF9C27B0), // Purple
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StatCard(
                title: 'Dépenses',
                value: _formatCurrency(stats.depensesJour.valeur),
                icon: Icons.money_off_rounded,
                color: AppTheme.error,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildServicesPopulaires() {
    if (_stats == null || _stats!.servicesPopulaires.isEmpty) {
      return _buildSection(
        title: 'Services Populaires',
        child: _buildEmptyMessage('Aucun service utilisé pour cette période.'),
      );
    }

    final services = _stats!.servicesPopulaires.take(3).toList();
    final totalRevenue = _stats!.totalRevenueServices;

    return _buildSection(
      title: 'Services Populaires',
      child: Column(
        children: services.map((service) {
          final percentage = totalRevenue > 0
              ? (service.totalMontant / totalRevenue * 100)
              : 0.0;
          return _ServiceItem(
            name: service.nomService,
            amount: _formatCurrency(service.totalMontant),
            percentage: percentage,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildActiviteRecente() {
    if (_stats == null || _stats!.activiteRecente.isEmpty) {
      return _buildSection(
        title: 'Activité Récente',
        child: _buildEmptyMessage(
          'Aucune activité récente pour cette période.',
        ),
      );
    }

    final activities = _stats!.activiteRecente.take(4).toList();

    return _buildSection(
      title: 'Activité Récente',
      child: Column(
        children: activities.map((activity) {
          return _ActivityItem(
            description: activity.description,
            time: DateFormat('HH:mm').format(activity.dateTransaction),
            amount: _formatCurrency(activity.montant),
            isRecette: activity.isRecette,
            category: activity.categorieServiceNom,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildResumeFinancier() {
    if (_stats == null) return const SizedBox.shrink();

    final resume = _stats!.resumeFinancier;

    return _buildSection(
      title: 'Résumé Financier',
      child: Row(
        children: [
          Expanded(
            child: _FinancialCard(
              title: 'Recettes',
              value: _formatCurrency(resume.totalRecettes),
              color: AppTheme.success,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _FinancialCard(
              title: 'Dépenses',
              value: _formatCurrency(resume.totalDepenses),
              color: AppTheme.error,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _FinancialCard(
              title: 'Bénéfice',
              value: _formatCurrency(resume.beneficeNet),
              color: AppTheme.primaryBlue,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection({required String title, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildEmptyMessage(String message) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Text(
        message,
        style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textSecondary),
      ),
    );
  }

  String _formatCurrency(double value) {
    final formatter = NumberFormat.currency(
      locale: 'fr_FR',
      symbol: 'Ar',
      decimalDigits: 0,
    );
    return formatter.format(value);
  }
}

// ============================================================================
// Widgets privés du Dashboard
// ============================================================================

/// Carte de statistique principale
class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final double? change;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.change,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 100, // Hauteur fixe pour toutes les cartes
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border(left: BorderSide(color: color, width: 4)),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Contenu texte
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    value,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                ),
                if (change != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    '${change! >= 0 ? '+' : ''}${change!.toStringAsFixed(1)}%',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      color: change! >= 0 ? AppTheme.success : AppTheme.error,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Icône
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
        ],
      ),
    );
  }
}

/// Item de service populaire
class _ServiceItem extends StatelessWidget {
  final String name;
  final String amount;
  final double percentage;

  const _ServiceItem({
    required this.name,
    required this.amount,
    required this.percentage,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  name,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                amount,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryBlue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: percentage / 100,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation(AppTheme.primaryBlue),
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }
}

/// Item d'activité récente
class _ActivityItem extends StatelessWidget {
  final String description;
  final String time;
  final String amount;
  final bool isRecette;
  final String category;

  const _ActivityItem({
    required this.description,
    required this.time,
    required this.amount,
    required this.isRecette,
    required this.category,
  });

  IconData get _categoryIcon {
    switch (category.toUpperCase()) {
      case 'INTERNET':
        return Icons.wifi_rounded;
      case 'IMPRESSION':
        return Icons.print_rounded;
      default:
        return isRecette
            ? Icons.arrow_upward_rounded
            : Icons.arrow_downward_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = isRecette ? AppTheme.success : AppTheme.error;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(_categoryIcon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  description,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  time,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${isRecette ? '+' : '-'}$amount',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

/// Carte du résumé financier
class _FinancialCard extends StatelessWidget {
  final String title;
  final String value;
  final Color color;

  const _FinancialCard({
    required this.title,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color.withValues(alpha: 0.8),
            ),
          ),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
